import cart from "../../models/cart.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const cartcount = async (req, res) => {
  try {
    if (req.user === "not_login") {
      return success(res, { status: 1, totalItems: 0 });
    }

    const user_id = req.user.id;
    const userCart = await cart.find({ user_id, orderstatus: "add to cart" });

    let totalItems = 0;
    if (userCart) {
      userCart.forEach((cartItem) => {
        totalItems += cartItem.product_qty;
      });
    }

    return success(res, { status: 1, totalItems });
  } catch (error) {
    console.error(`Cart Count Error: ${error}`);
    return fail(res, { status: "failed", errors: error.message });
  }
};

export default cartcount;
