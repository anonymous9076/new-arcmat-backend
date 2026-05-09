import ProductLead from "../../models/productlead.js";
import Product from "../../models/product.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getProductLeads = async (req, res) => {
    try {
        const query = {};
        if (req.user?.role === 'brand' || req.user?.role === 'custom_maker') {
            const selectedBrandIds = (req.user.selectedBrands || []).map((brand) => brand?._id || brand?.id || brand).filter(Boolean);
            const productIds = await Product.find({
                $or: [
                    { brand: { $in: selectedBrandIds } },
                    { createdBy: req.user.id }
                ]
            }).distinct('_id');
            query.productId = { $in: productIds };
        }

        const leads = await ProductLead.find(query)
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
