import attribute from "../../models/attribute.js";
import category from "../../models/category.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const updateattribute = async (req, res) => {
  try {
    const existingAttribute = await attribute.findById(req.params.id);
    if (!existingAttribute) {
      return fail(res, new Error("Attribute not found"), 404);
    }

    // Integrity Check: Prevent renaming if used in categories
    if (req.body.attributeName && req.body.attributeName !== existingAttribute.attributeName) {
      const categoryUsingAttribute = await category.findOne({
        attribute: existingAttribute.attributeName
      });

      if (categoryUsingAttribute) {
        return fail(res, new Error(`Cannot rename attribute '${existingAttribute.attributeName}' because it is used in category '${categoryUsingAttribute.name}'. Please remove it from the category first.`), 400);
      }
    }

    const valueary = req.body.attributeValues ? convertStringToArray(req.body.attributeValues) : (existingAttribute.attributeValues || []);
    const addattribute = {
      attributeName: req.body.attributeName || existingAttribute.attributeName,
      attributeValues: valueary,
      status: req.body.status !== undefined
        ? (req.body.status === 'Inactive' || req.body.status === 0 || req.body.status === '0' || req.body.status === false ? 0 : 1)
        : (existingAttribute.status !== undefined ? existingAttribute.status : 1)
    };
    const updatedattribute = await attribute.findByIdAndUpdate(
      req.params.id,
      addattribute,
      { new: true }
    );

    return success(res, updatedattribute, 200);
  } catch (err) {
    console.error("updateattribute error:", err);
    return fail(res, err, 500);
  }
};

function convertStringToArray(inputString) {
  if (!inputString || typeof inputString !== 'string') return [];
  const dataArray = inputString.split(",");

  const resultArray = dataArray.map((element) => {
    const numericValue = Number(element.trim());

    if (!isNaN(numericValue)) {
      return numericValue;
    }

    return element.trim();
  });

  return resultArray;
}

export default updateattribute;
