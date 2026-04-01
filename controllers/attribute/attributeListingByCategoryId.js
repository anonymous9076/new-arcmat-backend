import category from "../../models/category.js";
import attribute from "../../models/attribute.js";
import { success, fail } from '../../middlewares/responseHandler.js';


const attribute_listing_by_categoryid = async (req, res) => {
  try {
    const categorydata = await category.findById(req.params.id);
    if (!categorydata) {
      return fail(res, new Error("Category not found"), 404);
    }
    const attributes = await attribute.find({
      attributeName: { $in: categorydata.attribute },
    });
    return success(res, attributes, 200);
  } catch (err) {
    console.error("attribute_listing_by_categoryid error:", err);
    return fail(res, err, 500);
  }
};

export default attribute_listing_by_categoryid;
