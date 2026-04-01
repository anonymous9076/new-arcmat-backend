import cart from "../../models/cart.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const addtocartdelete = async (req, res) => {
  const { cart_id } = req.params;
  const user_id = req.user.id;

  try {
    // Find the cart item and ensure it belongs to the authenticated user
    const cartItem = await cart.findOne({ _id: cart_id, user_id });

    if (!cartItem) {
      return fail(res, { status: "failed", message: "Cart item not found or unauthorized" }, 404);
    }

    await cart.findByIdAndDelete(cart_id);

    return success(res, { status: "successfully", message: "Cart item deleted successfully" });
  } catch (error) {
    console.error(`Delete Cart Error: ${error}`);
    return fail(res, { status: "failed", errors: error.message });
  }
};

export default addtocartdelete;
