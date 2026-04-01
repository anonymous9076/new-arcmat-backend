import attribute from "../../models/attribute.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const attributelist = async (req, res) => {
  try {
    const { name, values, status, startDate, endDate } = req.query;
    const query = {};

    // Filter by attribute name (case-insensitive partial match)
    if (name) {
      query.attributeName = { $regex: name, $options: 'i' };
    }

    // Filter by values (case-insensitive partial match)
    if (values) {
      query.attributeValues = { $regex: values, $options: 'i' };
    }

    // Filter by status (numeric 0 or 1)
    if (status !== undefined) {
      query.status = parseInt(status);
    }

    // Filter by date range (createdAt)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // To include the entire end date, set time to the end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const attributedata = await attribute.find(query).sort({ createdAt: -1 });
    return success(res, attributedata, 200);
  } catch (err) {
    console.error("attributelist error:", err);
    return fail(res, err, 500);
  }
};

export default attributelist;
