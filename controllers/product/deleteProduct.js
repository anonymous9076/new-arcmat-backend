import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import RetailerProduct from "../../models/retailerproduct.js";
import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cleanupImages } from '../../utils/filecleanup.js';

const deleteproduct = async (req, res) => {
  try {
    const Product = await product.findById(req.params.id).select('createdBy').lean();

    if (!Product) {
      return fail(res, new Error('Product not found'), 404);
    }

    if (req.user && req.user.id) {
      const user = await Usertable.findById(req.user.id).select('role').lean();
      const isAdmin = user && user.role === 'admin';
      const isCreator = Product.createdBy && Product.createdBy.toString() === req.user.id.toString();

      if (!isAdmin && !isCreator) {
        return fail(res, new Error('You do not have permission to delete this product'), 403);
      }
    } else if (!req.body.forceDelete) {
      return fail(res, new Error('Authentication required to delete product'), 401);
    }

    // List variants to get their images for cleanup
    const variants = await variant.find({ productId: req.params.id }).select('variant_images').lean();
    await Promise.all(variants.map(v => cleanupImages(v.variant_images)));


    const deletedVariants = await variant.deleteMany({ productId: req.params.id });
    console.log(`Deleted ${deletedVariants.deletedCount} variants for product ${req.params.id}`);

    // Cleanup parent product images
    const productToDelete = await product.findById(req.params.id).select('product_images').lean();
    if (productToDelete) {
      await cleanupImages(productToDelete.product_images);
    }


    // Remove from retailer inventory
    const deletedRetailerProducts = await RetailerProduct.deleteMany({ productId: req.params.id });
    console.log(`Deleted ${deletedRetailerProducts.deletedCount} retailer inventory entries for product ${req.params.id}`);

    const deletedProduct = await product.findByIdAndDelete(req.params.id);

    return success(res, {
      status: "successfully deleted",
      data: deletedProduct,
      deletedVariants: deletedVariants.deletedCount,
      deletedRetailerEntries: deletedRetailerProducts.deletedCount
    }, 200);
  } catch (err) {
    console.error('deleteproduct error:', err);
    return fail(res, err, 500);
  }
};

export default deleteproduct;
