import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import Brand from "../../models/brand.js";
import { success, fail } from '../../middlewares/responseHandler.js';



const frontendList = async (req, res) => {
    try {
        const {
            search,
            categoryId,
            min_price,
            max_price,
            brand,
            color,
            size,
            weight,
            orderby,
            order,
            page = 1,
            limit = 12,
            status = 1,
            createdBy,
            user_id,
            myProducts,
            retailerId, // New query parameter for retailer-specific view
            onlyRetailerProducts = 'true' // Default to true for customer side
        } = req.query;

        const itemsPerPage = parseInt(limit);
        const pageNumber = parseInt(page);
        const skip = (pageNumber - 1) * itemsPerPage;

        // 1. Build Dynamic Query
        const query = {};

        // Resolve status: handle both numeric (new) and string "1"/"0" (from URL)
        // If status is "all", we skip the status filter to show both active and inactive products
        if (status === "all" || status === "All") {
            // No status filter applied
        } else if (status === "0" || status === 0 || status === "Inactive" || status === "false" || status === "InActive") {
            query.status = 0;
        } else {
            // Default to Active (Numeric 1)
            query.status = 1;
        }


        // Filter by creator (brand_id or user_id)
        const creatorId = createdBy || user_id || req.query.brandId;
        if (creatorId) {
            query.$or = [
                { createdBy: creatorId },
                { brand: creatorId }
            ];
        }

        // If user is authenticated and specifically requesting their own products
        if (req.user && req.user.id && myProducts === 'true') {
            query.createdBy = req.user.id;
        }

        // Search term logic
        if (search && search.trim().length > 0) {
            query.$or = [
                { product_name: { $regex: search, $options: "i" } },
                { product_unique_id: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { meta_keywords: { $regex: search, $options: "i" } },
            ];
        }

        // Category filtering logic
        if (categoryId) {
            const categoryFilter = {
                $or: [
                    { categoryId: categoryId },
                    { subcategoryId: categoryId },
                    { subsubcategoryId: categoryId }
                ]
            };

            if (query.$or) {
                const previousOr = query.$or;
                delete query.$or;
                query.$and = [
                    { $or: previousOr },
                    categoryFilter
                ];
            } else {
                query.$or = categoryFilter.$or;
            }
        }

        if (brand) {
            const brandIds = brand.split(',').filter(Boolean);
            const brandFilter = brandIds.length > 1 ? { $in: brandIds } : brandIds[0];

            if (query.$or) {
                // If we already have a creator filter, we need to be careful with $or
                // But usually 'brand' and 'creatorId' are the same intent here
                query.$and = query.$and || [];
                query.$and.push({
                    $or: [
                        { brand: brandFilter },
                        { createdBy: brandFilter }
                    ]
                });
            } else {
                query.$or = [
                    { brand: brandFilter },
                    { createdBy: brandFilter }
                ];
            }
        }

        // -------------------------------------------------------------------------
        // Variant Filtering (Price, Color, Size, Weight)
        // -------------------------------------------------------------------------
        const variantQuery = {};
        let needsVariantFilter = false;

        if (min_price || max_price) {
            variantQuery.selling_price = {};
            if (min_price) variantQuery.selling_price.$gte = parseInt(min_price);
            if (max_price) variantQuery.selling_price.$lte = parseInt(max_price);
            needsVariantFilter = true;
        }

        if (color) {
            const colors = color.split(',').filter(Boolean);
            if (colors.length > 1) {
                variantQuery.color = { $in: colors };
            } else if (colors.length === 1) {
                variantQuery.color = colors[0];
            }
            needsVariantFilter = true;
        }

        if (size) {
            variantQuery.size = size;
            needsVariantFilter = true;
        }

        if (weight) {
            const parts = weight.split(' ');
            if (parts.length === 2) {
                variantQuery.weight = parseInt(parts[0]);
                variantQuery.weight_type = parts[1];
            } else {
                variantQuery.weight = parseInt(weight);
            }
            needsVariantFilter = true;
        }

        if (needsVariantFilter) {
            const matchingVariants = await variant.find(variantQuery).distinct('productId');
            query._id = { $in: matchingVariants };
        }

        // -------------------------------------------------------------------------
        // Retailer-Specific Filtering (Only products they deal with or only overrides)
        // -------------------------------------------------------------------------
        if (retailerId) {
            const Usertable = (await import('../../models/user.js')).default;
            const retailer = await Usertable.findById(retailerId).select('selectedBrands');

            if (retailer && retailer.selectedBrands?.length > 0) {
                // By default, a retailer should only see products from brands they deal with
                const brandIds = retailer.selectedBrands.map(b => b.toString());

                if (query.createdBy) {
                    // Combine existing creator filter with authorized brands
                    query.createdBy = { $in: [query.createdBy, ...brandIds] };
                } else if (req.query.onlyAuthorizedBrands === 'true' || req.query.onlyOverrides === 'true') {
                    query.createdBy = { $in: brandIds };
                }
            }

            if (req.query.onlyOverrides === 'true') {
                const RetailerProduct = (await import('../../models/retailerproduct.js')).default;
                const overriddenProductIds = await RetailerProduct.find({ retailerId }).distinct('productId');
                query._id = { $in: overriddenProductIds };
            }
        } else if (onlyRetailerProducts === 'true') {
            // Global filter: only show products that have at least one retailer override
            const RetailerProduct = (await import('../../models/retailerproduct.js')).default;
            const overriddenProductIds = await RetailerProduct.find({ isActive: true }).distinct('productId');

            if (query._id) {
                if (query._id.$in) {
                    query._id.$in = query._id.$in.filter(id =>
                        overriddenProductIds.some(oid => oid.toString() === id.toString())
                    );
                } else {
                    query._id = {
                        $in: [query._id].filter(id =>
                            overriddenProductIds.some(oid => oid.toString() === id.toString())
                        )
                    };
                }
            } else {
                query._id = { $in: overriddenProductIds };
            }
        }
        // -------------------------------------------------------------------------

        // 2. Sorting Logic
        let sortOptions = {};
        if (orderby) {
            if (orderby === "trendingproduct" || orderby === "newarrivedproduct") {
                sortOptions[orderby] = 1;
                query[orderby] = 1;
            } else if (orderby === "selling_price") {
                // Sorting by price is now handled by sorting the final array
                // since price is in variants. We'll set a flag to sort later.
                sortOptions['createdAt'] = -1;
            } else {
                sortOptions[orderby] = order === "DESC" ? -1 : 1;
            }
        } else {
            sortOptions['createdAt'] = -1; // Default: Latest products
        }

        // 3. Get total count for pagination
        const totalItems = await product.countDocuments(query);

        const categoryCountQuery = { ...query };
        if (categoryCountQuery.$and) {
            categoryCountQuery.$and = categoryCountQuery.$and.filter(clause =>
                !clause.$or || !clause.$or.some(o => o.categoryId || o.subcategoryId || o.subsubcategoryId)
            );
            if (categoryCountQuery.$and.length === 0) delete categoryCountQuery.$and;
        } else if (categoryCountQuery.$or && categoryCountQuery.$or.some(o => o.categoryId)) {
            delete categoryCountQuery.$or;
        }

        const categoryCountsRaw = await product.aggregate([
            { $match: categoryCountQuery },
            {
                $facet: {
                    byCategory: [{ $group: { _id: "$categoryId", count: { $sum: 1 } } }],
                    bySubCategory: [{ $group: { _id: "$subcategoryId", count: { $sum: 1 } } }],
                    bySubSubCategory: [{ $group: { _id: "$subsubcategoryId", count: { $sum: 1 } } }]
                }
            }
        ]);

        const categoryCounts = { All: await product.countDocuments(categoryCountQuery) };
        const data = categoryCountsRaw[0];

        [...data.byCategory, ...data.bySubCategory, ...data.bySubSubCategory].forEach(item => {
            if (item._id) {
                const id = item._id.toString();
                categoryCounts[id] = (categoryCounts[id] || 0) + item.count;
            }
        });

        // 4. Fetch Products
        const products = await product
            .find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(itemsPerPage)
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name')
            .populate('subsubcategoryId', 'name')
            .populate('brand', 'name')
            .populate('createdBy', 'name email role')
            .lean();

        // 5. Attach variants to products efficiently (Fixing N+1 pattern)
        const productIds = products.map(p => p._id);
        const allVariants = await variant.find({ productId: { $in: productIds } }).lean();

        const productsWithVariants = products.map((p) => {
            const productVariants = allVariants.filter(v => v.productId.toString() === p._id.toString());

            // Get min/max price for display
            const prices = productVariants.map(v => v.selling_price).filter(price => price !== undefined);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
            const totalStock = productVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

            // Find variant with minPrice for MRP fallback
            const minPriceVariant = productVariants.find(v => v.selling_price === minPrice) || productVariants[0];

            return {
                ...p,
                variants: productVariants,
                minPrice,
                maxPrice,
                totalStock,
                selling_price: minPrice, // Compatibility
                mrp_price: minPriceVariant?.mrp_price || 0 // Compatibility
            };
        });

        // 5.5 Sort by price if requested
        if (orderby === "selling_price") {
            productsWithVariants.sort((a, b) => {
                return order === "DESC" ? b.minPrice - a.minPrice : a.minPrice - b.minPrice;
            });
        }

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // EXTRA: Statistics (Active vs Inactive counts) for the filtered scope
        const statsQuery = { ...query };
        delete statsQuery.status; // We want counts for both
        const [activeCount, inactiveCount] = await Promise.all([
            product.countDocuments({ ...statsQuery, status: 1 }),
            product.countDocuments({ ...statsQuery, status: 0 })
        ]);

        return success(res, {
            status: "success",
            data: productsWithVariants,
            pagination: {
                totalPages,
                itemsPerPage,
                totalItems,
                currentPage: pageNumber,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            },
            stats: {
                activeCount,
                inactiveCount,
                totalCount: activeCount + inactiveCount
            },
            categoryCounts
        }, 200);

    } catch (error) {
        console.error('frontendList error:', error);
        return fail(res, error, 500);
    }
};

export default frontendList;
