import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const bulkActivateProducts = async (req, res) => {
    try {
        const { brand } = req.body;

        if (!brand) {
            return fail(res, new Error('Brand is required'), 400);
        }

        let brandId = brand;

        // If the 'brand' passed is actually a user ID, resolve the first selectedBrand
        const existingUser = await Usertable.findById(brand);
        if (existingUser && existingUser.selectedBrands && existingUser.selectedBrands.length > 0) {
            const rawId = existingUser.selectedBrands[0];
            brandId = (rawId?._id || rawId?.id || rawId);
        }

        // Update all products for this brand to active status
        const productUpdate = await product.updateMany(
            { brand: brandId },
            { $set: { status: 1 } }
        );


        // Get all product IDs for this brand
        const brandProducts = await product.find({ brand: brandId }).select('_id').lean();
        const productIds = brandProducts.map(p => p._id);

        // Update all variants for these products to active status
        const variantUpdate = await variant.updateMany(
            { productId: { $in: productIds } },
            { $set: { status: 1 } }
        );

        return success(res, {
            message: 'Successfully activated all products and variants',
            productsActivated: productUpdate.modifiedCount,
            variantsActivated: variantUpdate.modifiedCount,
            totalProducts: productUpdate.matchedCount,
            totalVariants: variantUpdate.matchedCount
        }, 200);

    } catch (error) {
        console.error('bulkActivateProducts error:', error);
        return fail(res, error, 500);
    }
};

export default bulkActivateProducts;
