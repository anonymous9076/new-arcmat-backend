import variant from "../../models/productVariant.js";
import product from "../../models/product.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cleanupImages } from '../../utils/filecleanup.js';

const deleteproductvariant = async (req, res) => {
  try {
    const existingVariant = await variant.findById(req.params.id).lean();
    if (!existingVariant) {
      return fail(res, new Error("Variant not found"), 404);
    }

    // Permission check: Only admin, creator, or brand owner
    if (req.user && req.user.id) {
      const parentProduct = await product.findById(existingVariant.productId).select('createdBy brand').lean();
      const isAdmin = req.user.role === 'admin';
      const isCreator = parentProduct && parentProduct.createdBy && parentProduct.createdBy.toString() === req.user.id.toString();
      const isBrandOwner = req.user.selectedBrands && req.user.selectedBrands.includes(parentProduct?.brand?.toString());

      if (!isAdmin && !isCreator && !isBrandOwner) {
        return fail(res, new Error('You do not have permission to delete this variant'), 403);
      }
    }

    // Cleanup images
    await cleanupImages(existingVariant.variant_images);


    await variant.findByIdAndDelete(req.params.id);

    return success(res, {
      status: "successfully deleted",
      data: existingVariant
    });
  } catch (err) {
    console.error('deleteproductvariant error:', err);
    return fail(res, err, 500);
  }
};

export default deleteproductvariant;
