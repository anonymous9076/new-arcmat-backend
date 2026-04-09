import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    product_url: {
      type: String,
      required: true,
      unique: true,
    },
    product_unique_id: {
      type: String,
      required: true,
      unique: true,
    },
    product_images: {
      type: Array,
      default: [],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    subsubcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    // Creator tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usertable',
      required: true,
      index: true,
    },
    // Analytics tracking
    views: {
      type: Number,
      default: 0,
    },
    // Product Overview / Content
    description: {
      type: String,
      default: "",
    },
    meta_title: {
      type: String,
      default: "",
    },
    meta_keywords: {
      type: String,
      default: "",
    },
    meta_description: {
      type: String,
      default: "",
    },
    // Flags
    status: {
      type: Number,
      default: 0,
    },
    newarrivedproduct: {
      type: Number,
      default: 0,
    },
    trendingproduct: {
      type: Number,
      default: 0,
    },
    featuredproduct: {
      type: Number,
      default: 0,
    },
    // Tracks which bulk-import session created this product (for retry/cleanup)
    importSessionId: {
      type: String,
      index: true,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ brand: 1, status: 1 });
// productSchema.index({ product_url: 1 }); // Removed redundant non-unique index
productSchema.index({ createdBy: 1 });
productSchema.index({ status: 1 });
productSchema.index({ newarrivedproduct: 1, status: 1 });
productSchema.index({ trendingproduct: 1, status: 1 });
productSchema.index({ featuredproduct: 1, status: 1 });

// Full Text Index for search
productSchema.index({
  product_name: "text",
  product_unique_id: "text"
}, {
  weights: {
    product_name: 10,
    product_unique_id: 5
  },
  name: "ProductSearchIndex"
});

// AUTOMATION: Automatically resolve full hierarchy from the subsubcategoryId (Level 3)
productSchema.pre('validate', async function (next) {
  try {
    if (!this.subsubcategoryId) return next();

    const CategoryModel = mongoose.model('Category');
    const lvl3 = await CategoryModel.findById(this.subsubcategoryId).lean();

    if (!lvl3) return next(new Error('Specified subsubcategoryId (Level 3) not found'));
    if (lvl3.level !== 3) return next(new Error(`subsubcategoryId must be Level 3. Provided category is Level ${lvl3.level}`));

    // Set Level 2 (Subcategory)
    this.subcategoryId = lvl3.parentId;
    if (!this.subcategoryId) return next(new Error('Level 3 category is missing its Level 2 parent'));

    const lvl2 = await CategoryModel.findById(this.subcategoryId).lean();
    if (!lvl2) return next(new Error('Parent Level 2 category not found'));

    // Set Level 1 (Category)
    this.categoryId = lvl2.parentId;
    if (!this.categoryId) return next(new Error('Level 2 category is missing its Level 1 parent'));

    next();
  } catch (err) {
    next(err);
  }
});

const Product = mongoose.model("Product", productSchema);
export default Product;
