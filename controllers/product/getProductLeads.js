import ProductLead from "../../models/productlead.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getProductLeads = async (req, res) => {
    try {
        const leads = await ProductLead.find()
            .populate('productId', 'product_name name product_images secure_url')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        return success(res, leads, 200);
    } catch (error) {
        console.error("getProductLeads error:", error);
        return fail(res, error, 500);
    }
};

export default getProductLeads;
