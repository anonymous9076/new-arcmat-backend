import cart from "../../models/cart.js";
import variant from "../../models/productVariant.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const addtocartlist = async (req, res) => {
  try {
    const user_id = req.user.id;
    const userCart = await cart.find({ user_id, orderstatus: 'add to cart' })
      .populate('user_id', 'name email mobile')
      .populate('product_variant_id', 'variant_images description selling_price mrp_price weight weight_type')
      .populate('product_id', 'product_name product_images description sort_description');

    if (!userCart || userCart.length === 0) {
      return success(res, { status: "successfully", data: [], message: 'User cart is Empty' });
    }

    // Process each cart item to resolve prices if missing (e.g., for non-variant items)
    const refinedCart = await Promise.all(userCart.map(async (cartItem) => {
      const cartItemDoc = cartItem._doc || cartItem;

      // If it's a variant, use its prices directly
      if (cartItem.product_variant_id) {
        return {
          ...cartItemDoc,
          resolved_selling_price: Number(cartItem.product_variant_id.selling_price || 0),
          resolved_mrp_price: Number(cartItem.product_variant_id.mrp_price || 0)
        };
      }

      // If it's a base product, fetch its variants to get the default/min price
      const productVariants = await variant.find({ productId: cartItem.product_id?._id }).lean();
      const prices = productVariants.map(v => v.selling_price).filter(p => p !== undefined);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const matchingVariant = productVariants.find(v => v.selling_price === minPrice) || productVariants[0];

      return {
        ...cartItemDoc,
        resolved_selling_price: minPrice,
        resolved_mrp_price: Number(matchingVariant?.mrp_price || 0)
      };
    }));

    // Calculate total amount and total item number
    let total_Amount_with_discount = 0;
    let total_Amount_without_discount = 0;
    let totalItems = 0;
    let totalDiscount = 0;

    refinedCart.forEach((cartItem) => {
      const sellingPrice = cartItem.resolved_selling_price;
      const mrpPrice = cartItem.resolved_mrp_price;
      const qty = Number(cartItem.product_qty || 0);

      total_Amount_with_discount += qty * sellingPrice;
      total_Amount_without_discount += qty * mrpPrice;
      totalItems += qty;
      totalDiscount += (mrpPrice - sellingPrice) * qty;
    });

    const shipping_charges = total_Amount_with_discount > 1000 ? 0 : calculateFifteenPercent(total_Amount_with_discount);

    return success(res, {
      status: "successfully",
      data: refinedCart,
      total_Amount_with_discount_subtotal: total_Amount_with_discount,
      total_Amount_with_discount: (total_Amount_with_discount + shipping_charges),
      total_Amount_without_discount,
      totalItems,
      totalDiscount,
      shipping_charges
    });
  } catch (error) {
    console.error(`Cart List Error: ${error}`);
    return fail(res, { status: "failed", errors: error.message });
  }
}

function calculateFifteenPercent(totalAmount) {
  return totalAmount * 0.15;
}

export default addtocartlist;
