import category from "../../models/category.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const categorysingle = async (req, res) => {
  try {
    const categoryData = await category.findById(req.params.id);
    if (!categoryData) {
      return res.status(404).send({ error: "Category not found" });
    }

    // Fetch parent category if exists
    let parentCategory = null;
    if (categoryData.parentId) {
      parentCategory = await category.findById(categoryData.parentId).select('name slug level');
    }

    return success(res, {
      status: "successfully",
      data: categoryData,
      parent: parentCategory,
    });
  } catch (err) {
    console.error('categorysingle error:', err);
    return fail(res, err, 500);
  }
};

export default categorysingle;
