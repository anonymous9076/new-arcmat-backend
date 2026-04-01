import RetailerProduct from '../../models/retailerproduct.js';
import Product from '../../models/product.js'; // Ensure registration
import variant from '../../models/productVariant.js'; // Ensure registration
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get Retailer Products listing
 * GET /retailer/products
 */
const getRetailerProducts = async (req, res) => {
    try {
        const {
            retailerId: queryRetailerId,
            search,
            categoryId,
            brand,
            color,
            min_price,
            max_price,
            page = 1,
            limit = 12,
            type = 'dashboard' // 'dashboard' or 'storefront'
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. Build Base RetailerProduct Query
        let retailerQuery = {};

        // Identity/Scope handling
        const user = req.user && req.user !== 'not_login' ? req.user : null;

        if (user) {
            if (user.role === 'admin') {
                if (queryRetailerId) retailerQuery.retailerId = queryRetailerId;
            } else if (user.role === 'retailer') {
                retailerQuery.retailerId = user.id || user._id;
            } else {
                retailerQuery.isActive = true;
                if (queryRetailerId) {
                    retailerQuery.retailerId = queryRetailerId;
                } else if (type !== 'storefront') {
                    return success(res, { data: [], pagination: { totalItems: 0, totalPages: 0, currentPage: parseInt(page), limit: parseInt(limit) } }, 200);
                }
            }
        } else {
            retailerQuery.isActive = true;
            if (queryRetailerId) {
                retailerQuery.retailerId = queryRetailerId;
            } else {
                if (type === 'dashboard') {
                    return fail(res, new Error("Unauthorized dashboard access"), 401);
                }
                if (type !== 'storefront') {
                    return success(res, { data: [], pagination: { totalItems: 0, totalPages: 0, currentPage: parseInt(page), limit: parseInt(limit) } }, 200);
                }
            }
        }

        // 2. Complex Filtering (Product & Variant level)
        // Note: Since we query RetailerProduct, we need to resolve IDs of matching products/variants first

        // 2.1 Product Filters
        let productQuery = { status: 1 };
        let needsProductFilter = false;

        if (brand && brand.trim().length > 0) {
            const brandIds = brand.split(',').filter(Boolean);
            if (brandIds.length > 0) {
                productQuery.brand = brandIds.length > 1 ? { $in: brandIds } : brandIds[0];
                needsProductFilter = true;
            }
        }

        if (categoryId && categoryId.trim().length > 0 && categoryId !== 'null' && categoryId !== 'undefined') {
            productQuery.$or = [
                { categoryId: categoryId },
                { subcategoryId: categoryId },
                { subsubcategoryId: categoryId }
            ];
            needsProductFilter = true;
        }

        if (search && search.trim().length > 0) {
            const searchRegex = { $regex: search, $options: "i" };
            const searchFields = [
                { product_name: searchRegex },
                { product_unique_id: searchRegex },
                { sort_description: searchRegex }
            ];

            if (productQuery.$or) {
                productQuery.$and = [{ $or: productQuery.$or }, { $or: searchFields }];
                delete productQuery.$or;
            } else {
                productQuery.$or = searchFields;
            }
            needsProductFilter = true;
        }

        if (needsProductFilter) {
            const Product = (await import('../../models/product.js')).default;
            const matchingProductIds = await Product.find(productQuery).distinct('_id');
            retailerQuery.productId = { $in: matchingProductIds };
        }

        // 2.2 Variant/Override Filters
        if (color && color.trim().length > 0) {
            const colors = color.split(',').filter(Boolean);
            if (colors.length > 0) {
                const Variant = (await import('../../models/productVariant.js')).default;
                const matchingVariantIds = await Variant.find({ color: colors.length > 1 ? { $in: colors } : colors[0] }).distinct('_id');
                retailerQuery.variantId = { $in: matchingVariantIds };
            }
        }

        if (min_price !== undefined && min_price !== '' || max_price !== undefined && max_price !== '') {
            retailerQuery.selling_price = {};
            if (min_price !== undefined && min_price !== '') retailerQuery.selling_price.$gte = parseInt(min_price);
            if (max_price !== undefined && max_price !== '') retailerQuery.selling_price.$lte = parseInt(max_price);

            if (Object.keys(retailerQuery.selling_price).length === 0) {
                delete retailerQuery.selling_price;
            }
        }

        // 2.3 Dynamic Attribute Filters (attr_ prefix)
        const attributeFilters = Object.keys(req.query)
            .filter(key => key.startsWith('attr_'))
            .reduce((obj, key) => {
                const attrName = key.replace('attr_', '');
                const values = req.query[key].split(',').filter(Boolean);
                if (values.length > 0) {
                    obj[attrName] = values;
                }
                return obj;
            }, {});

        if (Object.keys(attributeFilters).length > 0) {
            const Variant = (await import('../../models/productVariant.js')).default;
            
            // Build $and query for multiple attributes
            const attrMatchQueries = Object.entries(attributeFilters).map(([key, values]) => ({
                dynamicAttributes: {
                    $elemMatch: {
                        key: key,
                        value: { $in: values }
                    }
                }
            }));

            const matchingVariantIds = await Variant.find({
                $and: attrMatchQueries
            }).distinct('_id');

            if (retailerQuery.variantId) {
                // Combine with existing variantId filter (e.g. from color)
                retailerQuery.variantId = { $and: [retailerQuery.variantId, { $in: matchingVariantIds }] };
            } else {
                retailerQuery.variantId = { $in: matchingVariantIds };
            }
        }

        // 3. Execution
        const totalItems = await RetailerProduct.countDocuments(retailerQuery);
        const retailerProducts = await RetailerProduct.find(retailerQuery)
            .populate({
                path: 'productId',
                populate: [
                    { path: 'brand', select: 'name logo' },
                    { path: 'categoryId', select: 'name' },
                    { path: 'subcategoryId', select: 'name' },
                    { path: 'subsubcategoryId', select: 'name' }
                ]
            })
            .populate('variantId')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 })
            .lean();

        // 4. Metadata Calculation (Storefront only)
        let metadata = {};
        if (type === 'storefront') {
            const metadataQuery = { ...retailerQuery };
            delete metadataQuery.selling_price;
            delete metadataQuery.variantId; // Get all colors/attributes for the base product query

            const allOverrides = await RetailerProduct.find(metadataQuery)
                .select('selling_price variantId')
                .populate('variantId', 'color dynamicAttributes')
                .lean();

            const prices = allOverrides.map(o => o.selling_price).filter(p => p !== undefined);
            const colors = allOverrides.map(o => o.variantId?.color).filter(Boolean);
            
            // Extract unique dynamic attributes
            const dynamicAttrMap = {};
            allOverrides.forEach(o => {
                if (o.variantId?.dynamicAttributes) {
                    o.variantId.dynamicAttributes.forEach(attr => {
                        if (!dynamicAttrMap[attr.key]) {
                            dynamicAttrMap[attr.key] = new Set();
                        }
                        dynamicAttrMap[attr.key].add(attr.value);
                    });
                }
            });

            const availableAttributes = Object.entries(dynamicAttrMap).map(([key, valueSet]) => ({
                key,
                values: Array.from(valueSet).sort()
            }));

            metadata = {
                minPrice: prices.length > 0 ? Math.min(...prices) : 0,
                maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
                availableColors: Array.from(new Set(colors)).sort(),
                availableAttributes
            };
        }

        // 5. Transformation
        const data = retailerProducts.map(rp => {
            if (type === 'storefront') {
                // Flatten variant structure for ProductCard compatibility
                return {
                    ...rp.variantId,
                    productId: rp.productId,
                    selling_price: rp.selling_price, // Retailer override
                    mrp_price: rp.mrp_price,         // Retailer override
                    stock: rp.stock,                 // Retailer override
                    retailer_id: rp.retailerId,
                    override_id: rp._id
                };
            }
            // Dashboard structure
            return {
                _id: rp._id,
                mrp_price: rp.mrp_price,
                selling_price: rp.selling_price,
                stock: rp.stock,
                isActive: rp.isActive,
                retailerId: rp.retailerId,
                product: rp.productId,
                variant: rp.variantId,
                createdAt: rp.createdAt,
                updatedAt: rp.updatedAt
            };
        });

        return success(res, {
            status: "success",
            data,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            },
            metadata
        }, 200);

    } catch (error) {
        console.error('getRetailerProducts error:', error);
        return fail(res, error, 500);
    }
};

export default getRetailerProducts;
