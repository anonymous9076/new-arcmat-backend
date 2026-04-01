import Category from "../../models/category.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const map = {};
    categories.forEach(cat => {
      map[cat._id] = { ...cat, children: [] };
    });

    const tree = [];
    categories.forEach(cat => {
      const node = map[cat._id];
      if (cat.parentId) {
        const parent = map[cat.parentId];
        if (parent) parent.children.push(node);
        else tree.push(node);
      } else {
        tree.push(node);
      }
    });

    return success(res, tree, 200);
  } catch (err) {
    console.error('getCategoryTree error:', err);
    return fail(res, err, 500);
  }
};

export default getCategoryTree;
