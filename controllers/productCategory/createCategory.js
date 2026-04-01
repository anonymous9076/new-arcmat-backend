import category from "../../models/category.js";
import slugify from "slugify";
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload } from "../../utils/cloudinaryupload.js";


const CategoryModel = category;

const createcategory = async (req, res) => {
  try {
    // Validate required fields
    const {
      category_name,
      category_url,
      editor,
      meta_description,
      meta_title,
      meta_keywords,
      parent_category,
      isActive,
      status,       // frontend sends 'status' field
      userid,
      showcase
    } = req.body;

    if (!category_name || !category_url || !editor) {
      return fail(res, new Error('Missing required fields: category_name, category_url, editor are required'), 400);
    }

    // Validate image is provided - OPTIONAL NOW
    // if (!req.files || !req.files.category_image || !req.files.category_image[0]) {
    //   return fail(res, new Error('Category image is required'), 400);
    // }

    // Check if category slug already exists GLOBALLY (across all brands)
    const slugifiedUrl = slugify(category_url);
    const existingSlug = await category.findOne({ slug: slugifiedUrl });
    if (existingSlug) {
      return fail(res, new Error(`This category URL is already taken by category "${existingSlug.name}" (ID: ${existingSlug._id}). Please choose a different URL.`), 409);
    }

    // Determine parentId and level
    let parentId = null;
    let level = 1;

    if (parent_category) {
      // Handle parent_category - can be string, array, or ObjectId
      if (typeof parent_category === 'string' && parent_category.trim() !== '') {
        parentId = parent_category;
      } else if (Array.isArray(parent_category) && parent_category.length > 0) {
        parentId = parent_category[0];
      }

      if (parentId) {
        // Validate parent category exists
        const p = await CategoryModel.findById(parentId).lean();
        if (!p) {
          return fail(res, new Error('Parent category not found'), 404);
        }

        if (p.level) {
          level = Math.min(3, p.level + 1);
        } else {
          level = 2;
        }
      }
    }

    // Handle image upload with Cloudinary
    let imageDetails = null;
    if (req.files && (req.files.category_image || Object.keys(req.files).length > 0)) {
      const files = req.files.category_image || req.files;
      const uploadResults = await cloudinaryUpload(userid || req.user?._id || 'admin', files, 'categories');
      if (uploadResults.length > 0) {
        imageDetails = uploadResults[0];
      }
    }

    const addcategory = new category({
      name: category_name,
      slug: slugifiedUrl,
      description: editor,
      metatitle: meta_title,
      metadesc: meta_description,
      isActive: (isActive === 'Active' || isActive === 1 || isActive === '1' || isActive === true || status === 'Active') ? 1 : 0,
      meta_keywords: meta_keywords,
      parentId,
      level,
      image: imageDetails,
      userid: userid || req.user?._id, // Support explicit body or req.user
      showcase: showcase ? (Array.isArray(showcase) ? showcase : showcase.split(',').filter(Boolean)) : []
    });


    const rel = await addcategory.save();
    return success(res, rel, 201);
  } catch (error) {
    console.error("createcategory error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return fail(res, new Error(`Category with this ${field} already exists`), 409);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return fail(res, new Error(`Validation error: ${messages}`), 400);
    }

    return fail(res, error, 500);
  }
};

export default createcategory;
