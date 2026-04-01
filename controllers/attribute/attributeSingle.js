import attribute from "../../models/attribute.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const attribute_single = async (req, res) => {
  try {
    const attributedata = await attribute.findById(req.params.id);
    if (!attributedata) {
      return fail(res, new Error("Attribute not found"), 404);
    }
    return success(res, attributedata, 200);
  } catch (err) {
    console.error("attribute_single error:", err);
    return fail(res, err, 500);
  }
};

export default attribute_single;
