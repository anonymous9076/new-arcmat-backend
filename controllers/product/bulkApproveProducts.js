import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const bulkApproveProducts = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return fail(res, new Error('Please provide an array of productIds to approve'), 400);
    }

    // This endpoint should be protected by Auth ('admin') at the route level, 
    // but we can add a sanity check here as well if needed.

    // 1. Update status to 1 for all listed products
    const productUpdateResult = await product.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: 1 } }
    );

    // 2. Update status to 1 for all variants belonging to these products
    const variantUpdateResult = await variant.updateMany(
      { productId: { $in: productIds } },
      { $set: { status: 1 } }
    );

    return success(res, {
      message: "Products approved successfully",
      approvedProductsCount: productUpdateResult.modifiedCount,
      approvedVariantsCount: variantUpdateResult.modifiedCount
    }, 200);

  } catch (err) {
    console.error('bulkApproveProducts error:', err);
    return fail(res, err, 500);
  }
};

export default bulkApproveProducts;
