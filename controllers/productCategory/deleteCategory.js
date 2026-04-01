import category from "../../models/category.js";
import Product from "../../models/product.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cloudinaryDelete } from "../../utils/cloudinaryupload.js";


const deletecategory = async (req, res) => {
  try {
    const id = req.params.id;

    // SECURITY: Verify the category belongs to this user
    const existingCategory = await category.findById(id);
    if (!existingCategory) {
      return fail(res, new Error("Category not found"), 404);
    }

    // Check ownership - only the owner or admin can delete
    const isOwner = existingCategory.userid && req.user._id && existingCategory.userid.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    // if (!isOwner && !isAdmin) {
    //   return fail(res, new Error("You don't have permission to delete this category"), 403);
    // }

    // Prevent deleting category which has children
    const child = await category.findOne({ parentId: id });
    if (child) return fail(res, new Error('Cannot delete category with child categories'), 400);

    // Prevent deleting category assigned to products
    const productUsing = await Product.findOne({ categoryId: id });
    if (productUsing) return fail(res, new Error('Cannot delete category assigned to products'), 400);

    // Cleanup image from Cloudinary
    if (existingCategory.image && existingCategory.image.public_id) {
      cloudinaryDelete(existingCategory.image.public_id).catch(err => console.error('Cloudinary cleanup error during category deletion:', err));
    }

    const categories = await category.findByIdAndDelete(id);
    return success(res, {
      status: "successfully delete",
      data: categories
    });

  } catch (err) {
    console.error('deletecategory error:', err);
    return fail(res, err, 500);
  }
};

export default deletecategory;
