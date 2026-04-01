import product from "../../models/product.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const featureitem = async (req, res) => {

  try {
    const featureitemlist = await product.find({ featuredproduct: 1 })
      .select('product_name _id selling_price mrp_price product_images brand')
      .populate('brand');
    return success(res, { status: "sucessfully", data: featureitemlist });
  } catch (err) {
    console.error(`featureitem error:`, err);
    return fail(res, err, 500);
  }
}

export default featureitem;
