import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import RetailerProduct from "../../models/retailerproduct.js";
import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cleanupImages } from '../../utils/filecleanup.js';

const bulkDeleteProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return fail(res, new Error('Please provide an array of productIds to delete'), 400);
    }

    if (!req.user || !req.user.id) {
      return fail(res, new Error('Authentication required to delete products'), 401);
    }

    const user = await Usertable.findById(req.user.id).select('role').lean();
    const isAdmin = user && user.role === 'admin';

    let deletedProductCount = 0;
    let deletedVariantCount = 0;
    let deletedRetailerEntryCount = 0;

    // Use a for...of loop to avoid partial S3 failures and to sequentially process each deletion
    for (const productId of productIds) {
      const Product = await product.findById(productId).select('createdBy product_images').lean();

      if (!Product) {
        continue; // Skip if not found
      }

      const isCreator = Product.createdBy && Product.createdBy.toString() === req.user.id.toString();

      if (!isAdmin && !isCreator) {
        continue; // Skip if no permission
      }

      // Cleanup variant images
      const variants = await variant.find({ productId }).select('variant_images').lean();
      for (const v of variants) {
        if (v.variant_images) {
          await cleanupImages(v.variant_images);
        }
      }

      const deletedVariants = await variant.deleteMany({ productId });
      deletedVariantCount += deletedVariants.deletedCount;

      // Cleanup parent product images
      if (Product.product_images) {
        await cleanupImages(Product.product_images);
      }

      // Remove from retailer inventory
      const deletedRetailerProducts = await RetailerProduct.deleteMany({ productId });
      deletedRetailerEntryCount += deletedRetailerProducts.deletedCount;

      // Delete the product itself
      await product.findByIdAndDelete(productId);
      deletedProductCount++;
    }

    return success(res, {
      status: "successfully deleted products",
      deletedProducts: deletedProductCount,
      deletedVariants: deletedVariantCount,
      deletedRetailerEntries: deletedRetailerEntryCount,
      totalRequested: productIds.length
    }, 200);

  } catch (err) {
    console.error('bulkDeleteProducts error:', err);
    return fail(res, err, 500);
  }
};

export default bulkDeleteProducts;
