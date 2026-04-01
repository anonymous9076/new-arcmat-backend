import attribute from "../../models/attribute.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const createattribute = async (req, res) => {
  try {
    const checkname = await checkIfAttributeExists(req.body.attributeName);
    if (checkname === true) {
      const valueary = req.body.attributeValues ? convertStringToArray(req.body.attributeValues) : [];
      const addattribute = new attribute({
        attributeName: req.body.attributeName,
        attributeValues: valueary,
        status: req.body.status === 'Inactive' || req.body.status === 0 || req.body.status === '0' || req.body.status === false ? 0 : 1,
      });
      const data = await addattribute.save();
      return success(res, data, 201);
    } else {
      return fail(res, new Error("Attribute Name with this name already exists"), 409);
    }
  } catch (error) {
    console.error("createattribute error:", error);
    return fail(res, error, 500);
  }
};

async function checkIfAttributeExists(name) {
  let category_response = await attribute.findOne({ attributeName: name });
  if (category_response == null) {
    return true;
  } else {
    return false;
  }
}


function convertStringToArray(inputString) {
  if (!inputString || typeof inputString !== 'string') return [];
  const dataArray = inputString.split(',');

  const resultArray = dataArray.map((element) => {
    const numericValue = Number(element.trim());

    if (!isNaN(numericValue)) {
      return numericValue;
    }

    return element.trim();
  });

  return resultArray;
}


export default createattribute;
