import attribute from "../../models/attribute.js";
import category from "../../models/category.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const deleteattribute = async (req, res) => {
  try {
    const attributeData = await attribute.findById(req.params.id);
    if (!attributeData) {
      return fail(res, new Error("Attribute not found"), 404);
    }

    // Check availability in categories using the attribute name
    const categoryUsingAttribute = await category.findOne({
      attribute: attributeData.attributeName
    });

    if (categoryUsingAttribute) {
      return fail(res, new Error(`Cannot delete attribute '${attributeData.attributeName}' because it is used in category '${categoryUsingAttribute.name}'`), 400);
    }

    await attribute.findByIdAndDelete(req.params.id);
    return success(res, attributeData, 200);
  } catch (err) {
    console.error("deleteattribute error:", err);
    return fail(res, err, 500);
  }
};

export default deleteattribute;
