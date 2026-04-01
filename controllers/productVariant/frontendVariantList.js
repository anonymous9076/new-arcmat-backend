import variant from "../../models/productVariant.js";
import product from "../../models/product.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Lists product variants with populated parent product data.
 * Supports granular filtering by both product-level and variant-level attributes.
 */
const frontend_variant_list = async (req, res) => {
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
            onlyRetailerProducts = 'true' // Default to true for customer side
        } = req.query;

        const itemsPerPage = parseInt(limit);
        const pageNumber = parseInt(page);
        const skip = (pageNumber - 1) * itemsPerPage;

        // 1. Build Product-Level Query
        const productQuery = { status: 1 }; // Default to active products

        if (brand) {
            const brandIds = brand.split(',').filter(Boolean);
            if (brandIds.length > 1) {
                productQuery.brand = { $in: brandIds };
            } else if (brandIds.length === 1) {
                productQuery.brand = brandIds[0];
            }
        }

        if (search && search.trim().length > 0) {
            productQuery.$or = [
                { product_name: { $regex: search, $options: "i" } },
                { skucode: { $regex: search, $options: "i" } },
                { sort_description: { $regex: search, $options: "i" } },
            ];
        }

        if (categoryId) {
            productQuery.$or = [
                { categoryId: categoryId },
                { subcategoryId: categoryId },
                { subsubcategoryId: categoryId }
            ];
        }

        // 2. Build Variant-Level Query
        const variantQuery = {};

        if (min_price || max_price) {
            variantQuery.selling_price = {};
            if (min_price) variantQuery.selling_price.$gte = parseInt(min_price);
            if (max_price) variantQuery.selling_price.$lte = parseInt(max_price);
        }

        if (color) {
            const colors = color.split(',').filter(Boolean);
            if (colors.length > 1) {
                variantQuery.color = { $in: colors };
            } else if (colors.length === 1) {
                variantQuery.color = colors[0];
            }
        }
        if (size) variantQuery.size = size;
        if (weight) variantQuery.weight = parseInt(weight);

        // 3. Link Queries: Get IDs of all Active products matching filters
        const matchingProductIds = await product.find(productQuery).distinct('_id');
        variantQuery.productId = { $in: matchingProductIds };

        // 3.5. Filter by Retailer Availability
        if (onlyRetailerProducts === 'true') {
            const RetailerProduct = (await import('../../models/retailerproduct.js')).default;
            const overriddenVariantIds = await RetailerProduct.find({ isActive: true }).distinct('variantId');

            if (variantQuery._id) {
                // If there's already an _id filter (e.g. from needsVariantFilter)
                if (variantQuery._id.$in) {
                    variantQuery._id.$in = variantQuery._id.$in.filter(id =>
                        overriddenVariantIds.some(oid => oid.toString() === id.toString())
                    );
                } else {
                    variantQuery._id = {
                        $in: [variantQuery._id].filter(id =>
                            overriddenVariantIds.some(oid => oid.toString() === id.toString())
                        )
                    };
                }
            } else {
                variantQuery._id = { $in: overriddenVariantIds };
            }
        }

        // 4. Sorting Logic
        let sortOptions = {};
        if (orderby === "selling_price") {
            sortOptions["selling_price"] = order === "DESC" ? -1 : 1;
        } else if (orderby === "createdAt") {
            sortOptions["createdAt"] = order === "DESC" ? -1 : 1;
        } else {
            sortOptions["createdAt"] = -1; // Default: Latest
        }

        // 5. Execution
        const totalItems = await variant.countDocuments(variantQuery);
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const variants = await variant.find(variantQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(itemsPerPage)
            .populate({
                path: 'productId',
                populate: [
                    { path: 'brand' },
                    { path: 'categoryId', select: 'name' },
                    { path: 'subcategoryId', select: 'name' },
                    { path: 'subsubcategoryId', select: 'name' },
                    { path: 'createdBy', select: 'name email role' }
                ]
            });

        // 6. Metadata (Full scope min/max price and available colors)
        const metadataQuery = { ...variantQuery };
        delete metadataQuery.selling_price; // We want full range
        delete metadataQuery.color;

        const metadataVariants = await variant.find(metadataQuery).select('selling_price color').lean();
        const prices = metadataVariants.map(v => v.selling_price).filter(p => p !== undefined);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const availableColors = Array.from(new Set(metadataVariants.map(v => v.color).filter(Boolean))).sort();

        return success(res, {
            status: "success",
            data: variants,
            pagination: {
                totalPages,
                itemsPerPage,
                totalItems,
                currentPage: pageNumber,
                hasNextPage: pageNumber < totalPages,
                hasPrevPage: pageNumber > 1
            },
            metadata: {
                minPrice,
                maxPrice,
                availableColors
            }
        }, 200);

    } catch (error) {
        console.error('frontend_variant_list error:', error);
        return fail(res, error, 500);
    }
};

export default frontend_variant_list;
