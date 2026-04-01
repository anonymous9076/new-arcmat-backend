import RetailerProduct from '../../models/retailerproduct.js';
import variant from '../../models/productVariant.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Delete Retailer Product override and return stock to original variant
 * DELETE /retailer/products/:id
 */
const deleteRetailerProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const retailerId = req.user.id;

        // 1. Find the override and ensure it belongs to the retailer
        const existingOverride = await RetailerProduct.findOne({ _id: id, retailerId });
        if (!existingOverride) {
            return fail(res, new Error('Product not found in your inventory'), 404);
        }

        // 2. Return stock to original brand variant atomically
        await variant.findByIdAndUpdate(existingOverride.variantId, {
            $inc: { stock: existingOverride.stock }
        });

        // 3. Delete the override
        await RetailerProduct.findByIdAndDelete(id);

        return success(res, { message: 'Product removed from inventory and stock returned to brand' }, 200);

    } catch (error) {
        console.error('deleteRetailerProduct error:', error);
        return fail(res, error, 500);
    }
};

export default deleteRetailerProduct;
