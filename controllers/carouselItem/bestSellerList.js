import product from "../../models/product.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const bestseller = async (req, res) => {
  try {
    const bestsellerlist = await product.find({ trendingproduct: 1 })
      .select('product_name _id selling_price mrp_price product_images brand')
      .populate('brand');
    return success(res, { status: "sucessfully", data: bestsellerlist });
  } catch (err) {
    console.error(`bestseller error:`, err);
    return fail(res, err, 500);
  }
}

export default bestseller;
