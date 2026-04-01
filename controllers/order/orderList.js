import order from "../../models/order.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const orderlist = async (req, res) => {
  try {
    const orderlisting = await order.find().populate('user_id', 'first_name last_name email mobile').sort({ createdAt: -1 });
    return success(res, { status: "sucessfully", data: orderlisting });

  } catch (err) {
    console.log(`  here is errror ${err}`);
    return fail(res, { status: "faild", errors: err });

  }
}

export default orderlist;
