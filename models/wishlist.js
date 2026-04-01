import mongoose from "mongoose";

const wishlistSchema = mongoose.Schema(
  {

    item_or_variant: {
      type: String,
      required: true,
      default: 'item',
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    product_variant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'variant',
      default: null
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usertable',
      required: true
    }
  },
  { timestamps: true }
);

const wishlist = mongoose.model("wishlist", wishlistSchema);
export default wishlist;
