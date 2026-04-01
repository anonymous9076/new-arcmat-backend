import ProductLead from "../../models/productlead.js";
import Product from "../../models/product.js";
import { sendProductLeadEmail } from "../../utils/emailutils.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const submitProductLead = async (req, res) => {
    try {
        const {
            productId,
            firstName,
            lastName,
            email,
            profession,
            company,
            city,
            address,
            no,
            postcode,
            tel,
            message,
            catalogue,
            priceList,
            bimCad,
            retailersList,
            contactRepresentative
        } = req.body;

        const userId = req.user ? req.user.id : null;

        if (!productId || !firstName || !lastName || !email || !city) {
            return fail(res, new Error("Required fields are missing"), 400);
        }

        const product = await Product.findById(productId);
        if (!product) {
            return fail(res, new Error("Product not found"), 404);
        }

        const newLead = new ProductLead({
            productId,
            userId,
            firstName,
            lastName,
            email,
            profession,
            company,
            city,
            address,
            no,
            postcode,
            tel,
            message,
            catalogue,
            priceList,
            bimCad,
            retailersList,
            contactRepresentative
        });

        await newLead.save();

        // Send email to admin
        await sendProductLeadEmail({
            productName: product.product_name || product.name,
            firstName,
            lastName,
            email,
            profession,
            company,
            city,
            address,
            no,
            postcode,
            tel,
            message,
            catalogue,
            priceList,
            bimCad,
            retailersList,
            contactRepresentative
        });

        return success(res, newLead, 201, "Lead submitted successfully");
    } catch (error) {
        console.error("submitProductLead error:", error);
        return fail(res, error, 500);
    }
};

export default submitProductLead;
