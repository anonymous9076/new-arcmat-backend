import category from "../../models/category.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const categorylist = async (req, res) => {
  try {
    const query = {};

    // Filter by user ID
    if (req.query.userid) {
      query.userid = req.query.userid;
    }

    // Filter by level (1, 2, or 3)
    if (req.query.level) {
      const level = parseInt(req.query.level);
      if (level >= 1 && level <= 3) {
        query.level = level;
      }
    }

    // Filter by parent ID
    if (req.query.parentId !== undefined) {
      // Support both "null" string and actual null
      if (req.query.parentId === 'null' || req.query.parentId === '') {
        query.parentId = null;
      } else {
        query.parentId = req.query.parentId;
      }
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = parseInt(req.query.isActive);
    }

    // Filter by name (case-insensitive search)
    if (req.query.name) {
      query.name = { $regex: req.query.name, $options: 'i' };
    }

    // Filter by slug
    if (req.query.slug) {
      query.slug = req.query.slug;
    }

    // Filter by showcase location
    if (req.query.showcase) {
      query.showcase = { $in: [req.query.showcase] };
    }

    const categories = await category.find(query).sort({ createdAt: -1 });
    return success(res, categories, 200);
  } catch (err) {
    console.error("categorylist error:", err);
    return fail(res, err, 500);
  }
};

export default categorylist;
