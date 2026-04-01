import variant from "../../models/productVariant.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const frontend_singleproductvariant = async (req, res) => {
  try {
    const { parentid } = req.params;

    // Build filter condition dynamically from query params
    const condition = { productId: parentid };

    // List of valid filterable fields for variants
    const allowedFilters = ['size', 'color', 'skucode', 'status', 'weight', 'weight_type'];

    Object.keys(req.query).forEach(key => {
      if (allowedFilters.includes(key)) {
        condition[key] = req.query[key];
      }
    });

    const data = await variant.find(condition);

    if (!data || data.length === 0) {
      return fail(res, new Error("Product variant not found matching these criteria"), 404);
    }

    return success(res, data, 200);
  } catch (err) {
    console.error("frontend_singleproductvariant error:", err);
    return fail(res, err, 500);
  }
};

export default frontend_singleproductvariant;
