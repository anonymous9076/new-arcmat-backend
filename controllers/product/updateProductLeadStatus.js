import ProductLead from "../../models/productlead.js";
import Product from "../../models/product.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateProductLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Reviewed', 'Contacted'].includes(status)) {
            return fail(res, new Error("Invalid status"), 400);
        }

        const lead = await ProductLead.findById(id).lean();
        if (!lead) {
            return fail(res, new Error("Lead not found"), 404);
        }

        if (req.user?.role === 'brand' || req.user?.role === 'custom_maker') {
            const selectedBrandIds = (req.user.selectedBrands || []).map((brand) => (brand?._id || brand?.id || brand).toString());
            const leadProduct = await Product.findById(lead.productId).select('brand createdBy').lean();
            const ownsProduct = leadProduct && (
                String(leadProduct.createdBy) === String(req.user.id) ||
                selectedBrandIds.includes(String(leadProduct.brand))
            );
            if (!ownsProduct) {
                return fail(res, new Error("You do not have permission to update this lead"), 403);
            }
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
