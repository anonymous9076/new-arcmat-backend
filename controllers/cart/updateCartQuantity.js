import cart from "../../models/cart.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const updateCartQuantity = async (req, res) => {
  try {
    const { cart_id, product_qty } = req.body;
    const user_id = req.user.id;

    if (!cart_id || product_qty === undefined) {
      return fail(res, { status: "failed", message: "cart_id and product_qty are required" }, 400);
    }

    const cartItem = await cart.findOne({ _id: cart_id, user_id });

    if (!cartItem) {
      return fail(res, { status: "failed", message: "Cart item not found or unauthorized" }, 404);
    }

    cartItem.product_qty = Number(product_qty);
    await cartItem.save();

    return success(res, { status: "successfully", data: cartItem });
  } catch (err) {
    console.error(`Update Cart Quantity Error: ${err}`);
    return fail(res, { status: "failed", errors: err.message });
  }
};

export default updateCartQuantity;
