import variant from "../../models/productVariant.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const productvariantlist = async (req, res) => {
  try {
    const productlisting = await variant.find({ productId: req.params.id });
    return success(res, productlisting, 200);
  } catch (err) {
    console.error("productvariantlist error:", err);
    return fail(res, err, 500);
  }
};

export default productvariantlist;
