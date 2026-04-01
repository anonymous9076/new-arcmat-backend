import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import slugify from "slugify";
import Category from "../../models/category.js";
import Usertable from "../../models/user.js";
import Brand from "../../models/brand.js";
import mongoose from "mongoose";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cloudinaryUpload, cloudinaryDelete } from "../../utils/cloudinaryupload.js";


const updateproduct = async (req, res) => {
  try {
    // Check if user has permission to update this product
    // Load existing product to ensure we have current data (especially images)
    const existingProduct = await product.findById(req.params.id).lean();

    if (!existingProduct) {
      return fail(res, new Error('Product not found'), 404);
    }

    // Check permissions: Only creator, admin, or brand owner can update
    if (req.user && req.user.id) {
      const isAdmin = req.user.role === 'admin';
      const isCreator = existingProduct.createdBy && existingProduct.createdBy.toString() === req.user.id.toString();
      const isBrandOwner = req.user.selectedBrands && req.user.selectedBrands.includes(existingProduct.brand?.toString());

      if (!isAdmin && !isCreator && !isBrandOwner) {
        return fail(res, new Error('You do not have permission to update this product'), 403);
      }
    } else if (!req.body.forceUpdate) {
      // Allow update without auth only if forceUpdate flag is set (for backward compatibility)
      return fail(res, new Error('Authentication required to update product'), 401);
    }
    const {
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
      categoryId,
      subsubcategoryId,
      existingImages,
      product_unique_id,
    } = req.body;

    const data = {};

    // Prioritize subsubcategoryId for the new LVL3 reference
    if (subsubcategoryId !== undefined) data.subsubcategoryId = subsubcategoryId.toString().trim();
    else if (categoryId !== undefined) data.subsubcategoryId = categoryId.toString().trim();

    // -------------------------------------------------------------------------
    // URL Uniqueness Check (Only in Products)
    if (product_url !== undefined) {
      const sluggedUrl = slugify(product_url, { lower: true, strict: true });
      const urlExistsInProducts = await product.findOne({ product_url: sluggedUrl, _id: { $ne: req.params.id } });
      if (urlExistsInProducts) {
        return fail(res, new Error(`Product URL "${sluggedUrl}" already exists. Please use a unique URL.`), 400);
      }
      data.product_url = sluggedUrl;
    }

    // Product Unique ID Uniqueness Check (Cross-Collection)
    if (product_unique_id !== undefined) {
      const skuExistsInProducts = await product.findOne({ product_unique_id, _id: { $ne: req.params.id } });
      const skuExistsInVariants = await variant.findOne({ skucode: product_unique_id });
      if (skuExistsInProducts || skuExistsInVariants) {
        return fail(res, new Error(`Product Unique ID "${product_unique_id}" already exists. Please use a unique ID.`), 400);
      }
      data.product_unique_id = product_unique_id;
    }
    // -------------------------------------------------------------------------

    // Only update fields that are provided
    if (product_name !== undefined) data.product_name = product_name;
    const productDescription = editor || description;
    if (productDescription !== undefined) data.description = productDescription;
    if (meta_title !== undefined) data.meta_title = meta_title;

    // Helper for boolean/numeric toggles
    const parseToggle = (val) => {
      if (val === undefined || val === null) return 0;
      if (val === 'Active' || val === 'true' || val === true || val === 1 || val === '1') return 1;
      return 0;
    };

    if (newarrivedproduct !== undefined) data.newarrivedproduct = parseToggle(newarrivedproduct);
    if (trendingproduct !== undefined) data.trendingproduct = parseToggle(trendingproduct);
    if (featuredproduct !== undefined) data.featuredproduct = parseToggle(featuredproduct);

    if (meta_keywords !== undefined) data.meta_keywords = meta_keywords;
    if (meta_description !== undefined) data.meta_description = meta_description;
    if (req.body.status !== undefined) data.status = parseToggle(req.body.status);


    // Handle existing images remaining
    let finalImages = [];
    if (existingImages !== undefined) {
      try {
        finalImages = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (e) {
        console.error('Error parsing existingImages:', e);
        finalImages = existingProduct.product_images || [];
      }
    } else {
      finalImages = existingProduct.product_images || [];
    }

    // Determine which images were removed for Cloudinary cleanup
    const existingPublicIds = (existingProduct.product_images || [])
      .map(img => img.public_id)
      .filter(id => !!id);

    const remainingPublicIds = finalImages
      .map(img => img.public_id)
      .filter(id => !!id);

    const publicIdsToDelete = existingPublicIds.filter(id => !remainingPublicIds.includes(id));

    // Handle new images if provided
    if (req.files && (Array.isArray(req.files) || (typeof req.files === 'object' && Object.keys(req.files).length > 0))) {
      const rawBrandId = existingProduct.brand || (req.user.selectedBrands && req.user.selectedBrands[0]);
      const brandId = (rawBrandId?._id || rawBrandId?.id || rawBrandId).toString();

      const filesToUpload = req.files.product_images || req.files;
      const uploadResults = await cloudinaryUpload(brandId, filesToUpload, 'products');
      
      // For single image enforcement, new images should replace or be combined then capped
      finalImages = [...finalImages, ...uploadResults];
    }

    // Strictly enforce single image
    if (finalImages.length > 1) {
      // Prioritize the newest uploaded image if any
      finalImages = [finalImages[finalImages.length - 1]];
    }

    // Always update product_images with the final set
    data.product_images = finalImages;

    // Cleanup deleted images from Cloudinary
    if (publicIdsToDelete.length > 0) {
      cloudinaryDelete(publicIdsToDelete).catch(err => console.error('Cloudinary cleanup error during update:', err));
    }



    const updated = await product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true })
      .populate('createdBy', 'name email role');

    if (!updated) {
      return fail(res, new Error('Product not found'), 404);
    }

    return success(res, updated, 200);

  } catch (err) {
    console.error('updateproduct error:', err);

    // Handle MongoDB duplicate key errors
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

export default updateproduct;
