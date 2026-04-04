import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import Brand from "../../models/brand.js";
import slugify from "slugify";
import Usertable from "../../models/user.js";
import mongoose from "mongoose";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload } from "../../utils/s3upload.js";

import { generateProductUniqueID } from "../../utils/productUtils.js";

const createproduct = async (req, res) => {
  try {
    const authenticatedUserId = req.user?.id || null;

    if (!authenticatedUserId) {
      return fail(res, new Error('User authentication required'), 401);
    }

    const user = await Usertable.findById(authenticatedUserId).select('role brand').lean();
    if (!user) {
      return fail(res, new Error('User not found'), 404);
    }

    let {
      product_name,
      product_url,
      meta_title,
      meta_keywords,
      meta_description,
      featuredproduct,
      trendingproduct,
      newarrivedproduct,
      editor,
      description,
      brand,
      subsubcategoryId,
      categoryId: incomingCategoryId,
      product_unique_id,
    } = req.body;

    const productDescription = editor || description;

    // Auto-generate Unique ID if not provided
    if (!product_unique_id) {
      product_unique_id = generateProductUniqueID();
    }

    // Validate required fields
    if (!product_name || !product_url || !productDescription) {
      return fail(res, new Error('Missing required fields: product_name, product_url, and description/editor are required'), 400);
    }

    // Unified Level-3 ID
    let assignedSubsubcategoryId = (subsubcategoryId || incomingCategoryId)?.toString().trim();

    // -------------------------------------------------------------------------
    // Cross-Collection Uniqueness Check
    const sluggedUrl = slugify(product_url, { lower: true, strict: true });

    // Check URL in product collection
    const urlExistsInProducts = await product.findOne({ product_url: sluggedUrl });
    if (urlExistsInProducts) {
      return fail(res, new Error(`Product URL "${sluggedUrl}" already exists. Please use a unique URL.`), 400);
    }

    // Check SKU in both collections
    const skuExistsInProducts = await product.findOne({ product_unique_id });
    const skuExistsInVariants = await variant.findOne({ skucode: product_unique_id });
    if (skuExistsInProducts || skuExistsInVariants) {
      return fail(res, new Error(`Product Unique ID "${product_unique_id}" already exists. Please use a unique ID.`), 400);
    }
    // -------------------------------------------------------------------------

    // Helper for boolean/numeric toggles
    const parseToggle = (val) => {
      if (val === undefined || val === null) return 0;
      if (val === 'Active' || val === 'true' || val === true || val === 1 || val === '1') return 1;
      return 0;
    };

    // BRAND OWNER LOGIC & ADMIN ASSIGNMENT
    const rawFinalBrand = (req.user.role === 'admin' && req.query.brandId)
      ? req.query.brandId
      : (req.user.selectedBrands && req.user.selectedBrands[0]);

    const targetUserId = req.user?.id;

    const finalBrand = (rawFinalBrand?._id || rawFinalBrand?.id || rawFinalBrand).toString();

    // Handle multiple images with S3
    let finalProductImages = [];
    if (req.files) {
      const files = req.files.product_images || req.files;
      if (files && (Array.isArray(files) || (typeof files === 'object' && Object.keys(files).length > 0))) {
        // Use our utility to upload to S3
        const uploadResults = await s3Upload(finalBrand, files, 'products');
        finalProductImages = uploadResults; // Array of { public_id, secure_url }
      }
    }

    if (finalProductImages.length === 0) {
      return fail(res, new Error('Product image is required. Please upload an image with field name "product_images"'), 400);
    }

    // Strictly enforce single image
    if (finalProductImages.length > 1) {
      finalProductImages = [finalProductImages[0]];
    }

    const productData = {
      product_name,
      product_url: sluggedUrl,
      subsubcategoryId: assignedSubsubcategoryId,
      product_images: finalProductImages,
      description: productDescription,
      brand: finalBrand,
      meta_title,
      newarrivedproduct: parseToggle(newarrivedproduct),
      trendingproduct: parseToggle(trendingproduct),
      featuredproduct: parseToggle(featuredproduct),
      meta_keywords,
      meta_description,
      product_unique_id,
      createdBy: targetUserId,
    };

    const insertproduct = new product(productData);
    const response = await insertproduct.save();

    return success(res, response, 201);

  } catch (err) {
    console.error('createproduct error:', err);
    console.log('Product Schema Paths:', Object.keys(product.schema.paths).join(', '));
    if (err.keyPattern) console.log('Error Key Pattern:', JSON.stringify(err.keyPattern));

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = field === 'product_url'
        ? 'Product URL already exists. Please use a unique URL.'
        : field === 'product_unique_id'
          ? 'Product Unique ID already exists. Please use a unique ID.'
          : 'Duplicate key error: ' + field;
      return fail(res, new Error(message), 400);
    }

    return fail(res, err, 500);
  }
};

export default createproduct;

