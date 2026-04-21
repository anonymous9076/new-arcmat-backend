import RetailerProduct from '../../models/retailerproduct.js';
import Product from '../../models/product.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Bulk remove products from retailer inventory
 * POST /retailer/inventory/bulk-remove
 */
const bulkRemoveInventory = async (req, res) => {
    try {
        const { variants, isGlobalSelectAll, brandId, excludedVariantIds = [] } = req.body;

        let retailerId = req.user.id;
        // If admin is doing this on behalf of retailer, allow retailerId in body
        if (req.user.role === 'admin' && req.body.retailerId) {
            retailerId = req.body.retailerId;
        }

        let deleteQuery = { retailerId };

        if (isGlobalSelectAll && brandId) {
            const productsRaw = await Product.find({ brand: brandId }).select('_id').lean();
            const productIds = productsRaw.map(p => p._id);
            
            deleteQuery.productId = { $in: productIds };
            if (excludedVariantIds.length > 0) {
                deleteQuery.variantId = { $nin: excludedVariantIds };
            }
        } else {
            if (!Array.isArray(variants) || variants.length === 0) {
                return fail(res, new Error("Please provide variants to remove"), 400);
            }
            
            const variantIds = variants.map(v => v.variantId);
            deleteQuery.variantId = { $in: variantIds };
        }

        const result = await RetailerProduct.deleteMany(deleteQuery);

        return success(res, {
            message: `Successfully removed ${result.deletedCount} products from inventory.`,
            removedCount: result.deletedCount
        }, 200);

    } catch (error) {
        console.error('bulkRemoveInventory error:', error);
        return fail(res, error, 500);
    }
};

export default bulkRemoveInventory;
