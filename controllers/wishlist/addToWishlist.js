import wishlist from "../../models/wishlist.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const addtowishlist = async (req, res) => {
  try {
    let {
      product_id,
      product_variant_id,
      item_or_variant,
    } = req.body;

    // Trim whitespace from string values
    if (typeof item_or_variant === 'string') {
      item_or_variant = item_or_variant.trim();
    }

    const user_id = req.user.id;

    // Debug logging - REMOVE AFTER FIXING
    console.log('=== WISHLIST ADD DEBUG ===');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('Extracted values:', { product_id, product_variant_id, item_or_variant });
    console.log('========================');

    // Validation
    if (!item_or_variant || (item_or_variant !== 'item' && item_or_variant !== 'variant')) {
      return fail(res, { message: `item_or_variant must be either "item" or "variant", received: "${item_or_variant}"` }, 400);
    }

    if (item_or_variant === 'item' && !product_id) {
      return fail(res, { message: 'product_id is required when item_or_variant is "item"' }, 400);
    }

    if (item_or_variant === 'variant' && (!product_id || !product_variant_id)) {
      return fail(res, { message: 'Both product_id and product_variant_id are required when item_or_variant is "variant"' }, 400);
    }

    // Check for duplicates
    const existingItem = await wishlist.findOne(
      item_or_variant === 'item'
        ? { user_id, product_id, item_or_variant: 'item' }
        : { user_id, product_variant_id, item_or_variant: 'variant' }
    );

    if (existingItem) {
      return fail(res, { message: 'Item already in wishlist' }, 409);
    }

    const addproduct = new wishlist({
      product_id: product_id || null,
      user_id,
      product_variant_id: product_variant_id || null,
      item_or_variant,
    });

    const response = await addproduct.save();
    return success(res, response, 201);

  } catch (err) {
    console.log(`Wishlist add error: ${err}`);
    return fail(res, err, 500);
  }
};

export default addtowishlist;
