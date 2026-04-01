import variant from "../../models/productVariant.js";
import product from "../../models/product.js";
import slugify from "slugify"
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload, cloudinaryDelete } from "../../utils/cloudinaryupload.js";


const updateproductvariant = async (req, res) => {
  try {
    const {
      weight_type,
      weight,
      stock,
      mrp_price,
      selling_price,
      status,
      skucode,
    } = req.body

    const data = {};

    // SKU code uniqueness and requirement check
    if (skucode !== undefined) {
      if (!skucode) {
        return fail(res, new Error('SKU code is required'), 400);
      }
      const skuExistsInProducts = await product.findOne({ skucode });
      const skuExistsInVariants = await variant.findOne({
        skucode: skucode,
        _id: { $ne: req.params.id }
      });
      if (skuExistsInProducts || skuExistsInVariants) {
        return fail(res, new Error('SKU code already exists. Please use a unique SKU code.'), 400);
      }
      data.skucode = skucode;
    }

    // Helper for boolean/numeric toggles
    const parseToggle = (val) => {
      if (val === undefined || val === null) return 0;
      if (val === 'Active' || val === 'true' || val === true || val === 1 || val === '1') return 1;
      return 0;
    };

    if (weight_type !== undefined) data.weight_type = weight_type;
    if (selling_price !== undefined) data.selling_price = isNaN(parseFloat(selling_price)) ? 0 : parseFloat(selling_price);
    if (mrp_price !== undefined) data.mrp_price = isNaN(parseFloat(mrp_price)) ? 0 : parseFloat(mrp_price);
    if (stock !== undefined) {
      data.stock = (stock === null || stock === '' || stock === 'null') ? null : (isNaN(parseInt(stock)) ? 0 : parseInt(stock));
    }
    if (status !== undefined) data.status = parseToggle(status);
    if (weight !== undefined) data.weight = isNaN(parseFloat(weight)) ? 0 : parseFloat(weight);

    if (req.body.dynamicAttributes !== undefined) {
      try {
        data.dynamicAttributes = typeof req.body.dynamicAttributes === 'string'
          ? JSON.parse(req.body.dynamicAttributes)
          : req.body.dynamicAttributes;
      } catch (e) {
        console.error('Error parsing dynamicAttributes:', e);
      }
    }

    // Fetch existing variant for current images
    const existingVariant = await variant.findById(req.params.id).lean();
    if (!existingVariant) {
      return fail(res, new Error("Variant not found"), 404);
    }

    // Handle existing images remaining
    let finalImages = [];
    if (req.body.existingImages !== undefined) {
      try {
        finalImages = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
      } catch (e) {
        console.error('Error parsing existingImages:', e);
      }
    } else {
      // Default to keeping all current images if existingImages is not provided
      finalImages = existingVariant.variant_images || [];
    }

    // List resources to delete if they are removed in this update
    const existingPublicIds = (existingVariant.variant_images || [])
      .map(img => img.public_id)
      .filter(id => !!id);

    const remainingPublicIds = finalImages
      .map(img => img.public_id)
      .filter(id => !!id);

    const publicIdsToDelete = existingPublicIds.filter(id => !remainingPublicIds.includes(id));

    // Handle new images (variant_images)
    let newImages = [];
    const files = req.files?.variant_images || req.files;
    if (files && (Array.isArray(files) || (typeof files === 'object' && Object.keys(files).length > 0))) {
      // Priority 1: Admin specified brand
      // Priority 2: User's own brand from profile
      // Priority 3: Parent product's existing brand
      let rawBrandId = (req.user.role === 'admin' && req.query.brandId)
        ? req.query.brandId
        : (req.user.selectedBrands && req.user.selectedBrands[0]);

      if (!rawBrandId && existingVariant?.productId) {
        const parentProduct = await product.findById(existingVariant.productId).select('brand').lean();
        if (parentProduct?.brand) {
          rawBrandId = parentProduct.brand;
        }
      }

      if (!rawBrandId) {
        return fail(res, new Error('Brand ID is required for variant image uploads.'), 400);
      }

      const brandId = (rawBrandId?._id || rawBrandId?.id || rawBrandId).toString();

      // Upload to Cloudinary
      newImages = await cloudinaryUpload(brandId, files, 'products');
    }

    // Combine images
    data.variant_images = [...finalImages, ...newImages];

    // Cleanup deleted images from Cloudinary
    if (publicIdsToDelete.length > 0) {
      cloudinaryDelete(publicIdsToDelete).catch(err => console.error('Cloudinary cleanup error during variant update:', err));
    }


    const updatedVariant = await variant.findByIdAndUpdate(req.params.id, data, { new: true })

    if (!updatedVariant) {
      return fail(res, new Error("Variant not found"), 404);
    }
    return success(res, updatedVariant, 200);

  } catch (err) {
    console.error(`updateproductvariant error: ${err}`);

    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = (field === 'skucode' || field === 'sku')
        ? 'SKU code already exists. Please use a unique SKU code.'
        : 'Duplicate key error: ' + field;
      return fail(res, new Error(message), 400);
    }

    return fail(res, err, 500);
  }
};

export default updateproductvariant;
