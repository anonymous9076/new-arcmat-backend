import wishlist from "../../models/wishlist.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const wishlist_list = async (req, res) => {
  try {
    const user_id = req.user.id;
    const wishlistdata = await wishlist
      .find({ user_id })
      .populate("user_id", "name email mobile")
      .populate("product_id", "name product_name image1 description weight weighttype brand")
      .populate({
        path: "product_variant_id",
        populate: {
          path: "productId",
          populate: [
            { path: 'brand' },
            { path: 'categoryId', select: 'name' },
            { path: 'subcategoryId', select: 'name' },
          ]
        }
      });
    return success(res, { data: wishlistdata, totalItems: wishlistdata.length }, 200);
  } catch (err) {
    console.error("wishlist_list error:", err);
    return fail(res, err, 500);
  }
};

export default wishlist_list;
