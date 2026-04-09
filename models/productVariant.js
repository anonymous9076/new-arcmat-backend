import mongoose from "mongoose";

const productvariantSchema = mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    variant_images: {
      type: Array,
      default: [],
    },
    skucode: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    status: {
      type: Number,
      // 0 = Inactive, 1 = Active
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    weight_type: {
      type: String,
      default: "ml",
    },
    mrp_price: {
      type: Number,
      required: true,
      default: 0,
    },
    selling_price: {
      type: Number,
      required: true,
      default: 0,
    },
    stock: {
      type: Number,
    },
    dynamicAttributes: {
      type: Array,
      default: [],
    },
    // Tracks which bulk-import session created this variant (for retry/cleanup)
    importSessionId: {
      type: String,
      index: true,
      default: null,
    },
  },
  { timestamps: true }
);

productvariantSchema.index({ productId: 1, status: 1 });
// productvariantSchema.index({ skucode: 1 }); // Removed redundant non-unique index
productvariantSchema.index({ selling_price: 1 });
productvariantSchema.index({ stock: 1 });
productvariantSchema.index({ status: 1 });

const Variant = mongoose.model("variant", productvariantSchema);
export default Variant;
