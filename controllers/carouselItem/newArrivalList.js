import product from "../../models/product.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const newarrival = async (req, res) => {
  try {
    const newarrivallist = await product.find({ newarrivedproduct: 1 })
      .select('product_name _id selling_price mrp_price product_images brand')
      .populate('brand');
    return success(res, { status: "sucessfully", data: newarrivallist });
  } catch (err) {
    console.error(`newarrival error:`, err);
    return fail(res, err, 500);
  }
}

export default newarrival;
