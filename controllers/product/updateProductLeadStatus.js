import ProductLead from "../../models/productlead.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateProductLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Reviewed', 'Contacted'].includes(status)) {
            return fail(res, new Error("Invalid status"), 400);
        }

        const updatedLead = await ProductLead.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate('productId', 'product_name name product_images secure_url')
         .populate('userId', 'name email');

        if (!updatedLead) {
            return fail(res, new Error("Lead not found"), 404);
        }

        return success(res, updatedLead, 200, "Status updated successfully");
    } catch (error) {
        console.error("updateProductLeadStatus error:", error);
        return fail(res, error, 500);
    }
};

export default updateProductLeadStatus;
