import Product from '../../models/product.js';
import variant from '../../models/productVariant.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get all products for a specific brand (for retailer selection)
 * GET /retailer/brands/:brandId/inventory
 */
const getBrandInventory = async (req, res) => {
    try {
        const { brandId } = req.params;
        const { page = 1, limit = 12, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { brand: brandId, status: 1 }; // Only active products

        if (search && search.trim().length > 0) {
            query.product_name = { $regex: search, $options: "i" };
        }

        const totalItems = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('categoryId', 'name')
            .populate('brand', 'name logo')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1, _id: -1 })
            .lean();

        // Attach variants to each product and check if already in retailer's inventory
        const RetailerProduct = (await import('../../models/retailerproduct.js')).default;
        let retailerId = req.user.id;

        // If admin, they might be viewing on behalf of a retailer
        if (req.user.role === 'admin' && req.query.retailerId) {
            retailerId = req.query.retailerId;
        }

        const productsWithVariants = await Promise.all(products.map(async (p) => {
            const variants = await variant.find({ productId: p._id }).lean();

            // Check which variants are already in this retailer's inventory
            const existingOverrides = await RetailerProduct.find({
                retailerId,
                productId: p._id,
                variantId: { $in: variants.map(v => v._id) }
            }).select('variantId');

            const addedVariantIds = existingOverrides.map(o => o.variantId.toString());

            return {
                ...p,
                variants: variants.map(v => ({
                    ...v,
                    isAdded: addedVariantIds.includes(v._id.toString())
                }))
            };
        }));

        return success(res, {
            data: productsWithVariants,
            pagination: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        }, 200);

    } catch (error) {
        console.error('getBrandInventory error:', error);
        return fail(res, error, 500);
    }
};

export default getBrandInventory;
