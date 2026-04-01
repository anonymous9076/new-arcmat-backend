import variant from "../../models/productVariant.js";
import product from "../../models/product.js";
import slugify from "slugify";
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload } from "../../utils/cloudinaryupload.js";


const createvariant = async (req, res) => {
  console.log(req.body, "body")
  try {
    const {
      productId,
      weight_type,
      weight,
      stock,
      skucode,
      mrp_price,
      selling_price,
      status,
    } = req.body;

    // Handle multiple images (variant_images)
    let variantImages = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      variantImages = req.files.map(file => file.filename);
    } else if (req.files && req.files.variant_images && Array.isArray(req.files.variant_images)) {
      variantImages = req.files.variant_images.map(file => file.filename);
    }

    // Validate at least one image is provided
    if (variantImages.length === 0) {
      return fail(res, new Error('At least one variant image is required. Please upload images with field name "variant_images"'), 400);
    }

    // Validate required fields
    if (!productId || !skucode) {
      return fail(res, new Error('productId and skucode are required'), 400);
    }

    const trimmedProductId = productId.trim();

    // Get the parent product to extract brand owner information
    const parentProduct = await product.findById(trimmedProductId).select('brand createdBy').lean();
    if (!parentProduct) {
      return fail(res, new Error('Parent product not found'), 404);
    }

    // Priority 1: Product's own brand (for consistency across variants)
    // Priority 2: Admin specified brand in query
    // Priority 3: User's own brand from profile
    const rawBrandId = parentProduct.brand ||
      (req.user.role === 'admin' && req.query.brandId ? req.query.brandId : (req.user.selectedBrands && req.user.selectedBrands[0]));

    if (!rawBrandId) {
      return fail(res, new Error('Brand ID is required. Please ensure the parent product or user has a registered brand.'), 400);
    }

    // Convert ObjectId to string (selectedBrands may contain Mongoose ObjectIds)
    let brandId = (rawBrandId?._id || rawBrandId?.id || rawBrandId).toString();


    // Check SKU in both collections (if provided)
    if (skucode) {
      const skuExistsInProducts = await product.findOne({ skucode });
      const skuExistsInVariants = await variant.findOne({ skucode });
      if (skuExistsInProducts || skuExistsInVariants) {
        return fail(res, new Error('SKU code already exists. Please use a unique SKU code.'), 400);
      }
    }
    // -------------------------------------------------------------------------

    // Helper for boolean/numeric toggles
    const parseToggle = (val) => {
      if (val === undefined || val === null) return 0;
      if (val === 'Active' || val === 'true' || val === true || val === 1 || val === '1') return 1;
      return 0;
    };

    // Handle multiple images with Cloudinary
    let finalVariantImages = [];
    if (req.files) {
      const files = req.files.variant_images || req.files;
      if (files && (Array.isArray(files) || (typeof files === 'object' && Object.keys(files).length > 0))) {
        // Use our utility to upload to Cloudinary
        const uploadResults = await cloudinaryUpload(brandId, files, 'products');
        finalVariantImages = uploadResults; // Array of { public_id, secure_url }
      }
    }


    const insertvariant = new variant({
      productId: trimmedProductId,
      variant_images: finalVariantImages, // Brand-prefixed paths
      weight_type: weight_type || "ml",
      selling_price: isNaN(parseFloat(selling_price)) ? 0 : parseFloat(selling_price),
      mrp_price: isNaN(parseFloat(mrp_price)) ? 0 : parseFloat(mrp_price),
      stock: (stock === undefined || stock === null || stock === '') ? undefined : (isNaN(parseInt(stock)) ? 0 : parseInt(stock)),
      skucode,
      status: parseToggle(status),
      weight: weight ? (isNaN(parseFloat(weight)) ? 0 : parseFloat(weight)) : 0,
      dynamicAttributes: req.body.dynamicAttributes ? (typeof req.body.dynamicAttributes === 'string' ? JSON.parse(req.body.dynamicAttributes) : req.body.dynamicAttributes) : [],
    });

    const response = await insertvariant.save();
    return success(res, response, 201);
  } catch (err) {
    console.error("createvariant error:", err);

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

export default createvariant;
