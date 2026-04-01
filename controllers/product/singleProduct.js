import product from "../../models/product.js";
import category from "../../models/category.js";
import variant from "../../models/productVariant.js";
import wishlist from "../../models/wishlist.js";
import mongoose from "mongoose";
import { success, fail } from '../../middlewares/responseHandler.js';


const singleProduct = async (req, res) => {
  try {
    const data = await product.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name')
      .populate('subsubcategoryId', 'name')
      .populate('brand');

    if (data) {
      data.views = (data.views || 0) + 1;
      await data.save();
    }

    if (!data) {
      return fail(res, new Error("Product not found"), 404);
    }

    const user_id = req.user && req.user.id ? req.user.id : null;

    // 1. Check wishlist status for the main product
    let wishlist_status = false;
    if (user_id) {
      const productWishlistEntry = await wishlist.findOne({
        user_id,
        product_id: req.params.id,
      });
      wishlist_status = !!productWishlistEntry;
    }

    // 2. Fetch Categories (Backward compatible mapping)
    const parentcategory = data.categoryId ? [data.categoryId] : [];
    const childcategory = data.subcategoryId ? [data.subcategoryId] : [];
    const subsubcategory = data.subsubcategoryId ? [data.subsubcategoryId] : [];

    // 3. Fetch Variants & their Wishlist Status
    let variantsWithStatus = [];

    try {
      const productVariants = await variant.find({ productId: req.params.id });

      const variantIds = productVariants.map((v) => v._id);

      // Check wishlist status for variants
      const variantWishlistEntries = user_id
        ? await wishlist.find({
          user_id,
          product_variant_id: { $in: variantIds },
        })
        : [];

      const variantWishlistMap = new Map(
        variantWishlistEntries.map((entry) => [entry.product_variant_id.toString(), true])
      );

      variantsWithStatus = productVariants.map((v) => {
        const variantDoc = v._doc || v;
        const variantWishlistStatus = variantWishlistMap.has(v._id.toString());

        return {
          ...variantDoc,
          wishlist_status: variantWishlistStatus,
        };
      });

    } catch (error) {
      console.error('Error fetching variants:', error);
    }

    // 4. Calculate pricing metadata
    const prices = variantsWithStatus.map(v => v.selling_price).filter(price => price !== undefined);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const totalStock = variantsWithStatus.reduce((sum, v) => sum + (v.stock || 0), 0);

    return success(res, {
      status: "successfully",
      data: {
        ...data._doc,
        wishlist_status,
        variants: variantsWithStatus,
        minPrice,
        maxPrice,
        totalStock
      },
      parentcategory,
      childcategory,
      subsubcategory,
      productvariant: variantsWithStatus, // Keep for backward compatibility
      slug: data.product_name ? data.product_name.replace(/\s/g, "-").toLowerCase() : "",
    }, 200);

  } catch (err) {
    console.error('singleProduct error:', err);
    return fail(res, err, 500);
  }
};


export default singleProduct;
