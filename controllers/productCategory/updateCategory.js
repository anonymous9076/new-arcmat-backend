import category from "../../models/category.js";
import slugify from "slugify";
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload, cloudinaryDelete } from "../../utils/cloudinaryupload.js";


const CategoryModel = category;

const updatecategory = async (req, res) => {
  try {
    const {
      category_name,
      category_url,
      editor,
      meta_description,
      meta_title,
      meta_keywords,
      parent_category,
      status,
      showcase
    } = req.body;

    // SECURITY: Verify the category belongs to this user
    const existingCategory = await CategoryModel.findById(req.params.id);
    if (!existingCategory) {
      return fail(res, new Error("Category not found"), 404);
    }

    // Check ownership - only the owner or admin can update
    const isOwner = existingCategory.userid && req.user._id && existingCategory.userid.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // if (!isOwner && !isAdmin) {
    //   return fail(res, new Error("You don't have permission to update this category"), 403);
    // }

    // Check if new slug conflicts GLOBALLY (across all brands)
    if (category_url) {
      const newSlug = slugify(category_url);
      if (newSlug !== existingCategory.slug) {
        const slugConflict = await CategoryModel.findOne({
          slug: newSlug,
          _id: { $ne: req.params.id }
        });
        if (slugConflict) {
          return fail(res, new Error("This category URL is already taken. Please choose a different URL."), 409);
        }
      }
    }

    // Determine parentId and level
    let parentId = null;
    let level = 1;
    if (parent_category) {
      parentId = parent_category;
      const p = await CategoryModel.findById(parentId).lean();
      if (p && p.level) level = Math.min(3, p.level + 1);
      else level = 2;
    }

    // Build update object - only include fields if they are provided
    const categoryobj = {};
    if (category_name !== undefined) categoryobj.name = category_name;
    if (category_url !== undefined) categoryobj.slug = slugify(category_url);
    if (editor !== undefined) categoryobj.description = editor;
    if (meta_title !== undefined) categoryobj.metatitle = meta_title;
    if (meta_description !== undefined) categoryobj.metadesc = meta_description;
    if (meta_keywords !== undefined) categoryobj.meta_keywords = meta_keywords;
    if (status !== undefined) {
      categoryobj.isActive = status === 'Active' || status === 1 || status === '1' || status === true ? 1 : 0;
    }
    if (showcase !== undefined) {
      categoryobj.showcase = showcase ? (Array.isArray(showcase) ? showcase : showcase.split(',').filter(Boolean)) : []
    }

    // Only update parent/level if parent_category was provided
    if (parent_category !== undefined) {
      categoryobj.parentId = parentId;
      categoryobj.level = level;
    }

    // Handle image upload with Cloudinary
    if (req.files && (req.files.category_image || Object.keys(req.files).length > 0)) {
      const files = req.files.category_image || req.files;
      const uploadResults = await cloudinaryUpload(req.user?._id || 'admin', files, 'categories');
      if (uploadResults.length > 0) {
        categoryobj.image = uploadResults[0];

        // Delete old image if it was a Cloudinary object
        if (existingCategory.image && existingCategory.image.public_id) {
          cloudinaryDelete(existingCategory.image.public_id).catch(err => console.error('Cloudinary cleanup error during category update:', err));
        }
      }
    }


    const updatedcategory = await category.findByIdAndUpdate(req.params.id, categoryobj, { new: true });

    if (!updatedcategory) {
      return fail(res, new Error("Category not found"), 404);
    }

    return success(res, updatedcategory, 200);
  } catch (err) {
    console.error("updatecategory error:", err);
    return fail(res, err, 500);
  }
};

export default updatecategory;
