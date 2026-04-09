import Product from '../../models/product.js';
import Variant from '../../models/productVariant.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * DELETE /product/bulk-session
 * Body: { sessionId: string, step: 'product' | 'variant' }
 *
 * Clears all products+their variants (step=product) or just variants (step=variant)
 * that were created under the given importSessionId. Used by the frontend's
 * "Retry Upload" button so stale data is purged before re-importing.
 */
const clearBulkSession = async (req, res) => {
  try {
    const { sessionId, step } = req.body;

    if (!sessionId) {
      return fail(res, new Error('sessionId is required'), 400);
    }

    if (!['product', 'variant'].includes(step)) {
      return fail(res, new Error("step must be 'product' or 'variant'"), 400);
    }

    let deletedProducts = 0;
    let deletedVariants = 0;

    if (step === 'product') {
      // Find all products from this session
      const sessionProducts = await Product.find(
        { importSessionId: sessionId },
        { _id: 1 }
      ).lean();

      const productIds = sessionProducts.map(p => p._id);

      // Delete variants that belong to those products (cascade)
      if (productIds.length > 0) {
        const variantResult = await Variant.deleteMany({
          productId: { $in: productIds }
        });
        deletedVariants = variantResult.deletedCount;
      }

      // Delete the products themselves
      const productResult = await Product.deleteMany({ importSessionId: sessionId });
      deletedProducts = productResult.deletedCount;

    } else {
      // step === 'variant': only remove variants from this session
      const variantResult = await Variant.deleteMany({ importSessionId: sessionId });
      deletedVariants = variantResult.deletedCount;
    }

    return success(res, {
      message: `Cleared session "${sessionId}" (step: ${step})`,
      deletedProducts,
      deletedVariants,
    }, 200);

  } catch (err) {
    console.error('clearBulkSession error:', err);
    return fail(res, err, 500);
  }
};

export default clearBulkSession;
