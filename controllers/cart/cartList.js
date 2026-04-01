import cart from "../../models/cart.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const cartlist = async (req, res) => {
  try {
    const cartlisting = await cart.find().populate('user_id', 'name email mobile').populate('product_variant_id', 'product_name product_images description selling_price mrp_price weight weighttype').populate('product_id', 'product_name product_images description selling_price mrp_price weight weighttype').sort({ createdAt: -1 });
    return success(res, { status: "sucessfully", data: cartlisting });;

  } catch (err) {
    console.log(`  here is errror ${err}`);
    return fail(res, { status: "faild", errors: err });;
  }
}

export default cartlist;
