import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true, // Global uniqueness across all brands
      lowercase: true,
      index: true,
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },

    metatitle: {
      type: String,
      trim: true,
    },

    metadesc: {
      type: String,
      trim: true,
    },

    meta_keywords: {
      type: String,
      trim: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },

    level: {
      type: Number,
      enum: [1, 2, 3],
      default: 1,
    },

    attribute: {
      type: Array,
      default: [],
    },

    image: mongoose.Schema.Types.Mixed,


    isActive: {
      type: Number,
      default: 1,
    },

    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    showcase: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Indexes
categorySchema.index({ parentId: 1 });
categorySchema.index({ slug: 1 });

export default mongoose.model('Category', categorySchema);
