import BrandLead from "../../models/brandLead.js";
import Brand from "../../models/brand.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { sendBrandQueryEmail } from "../../utils/emailutils.js";

export const createBrandLead = async (req, res) => {
    try {
        const { id: brandId } = req.params;
        const { name, email, phone, location, query } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!name || !email || !phone || !location || !query) {
            return fail(res, new Error("All fields are required"), 422);
        }

        const brand = await Brand.findById(brandId).populate('userId', 'email');
        if (!brand) {
            return fail(res, new Error("Brand not found"), 404);
        }

        const newLead = new BrandLead({
            brandId,
            userId,
            name,
            email,
            phone,
            location,
            query
        });

        const savedLead = await newLead.save();

        // Email Priority: Bespoke Contact Email > User Email > Admin Email
        const recipientEmail = brand.bespokePage?.contact?.email || brand.userId?.email || process.env.SMPT_MAIL;

        // Send Email Notification
        await sendBrandQueryEmail({
            brandName: brand.name,
            brandEmail: recipientEmail,
            name,
            email,
            phone,
            location,
            query
        });

        return success(res, savedLead, 201);
    } catch (error) {
        console.error("createBrandLead error:", error);
        return fail(res, error, 500);
    }
};

export const listBrandLeads = async (req, res) => {
    try {
        const { brandId } = req.query;
        let filter = {};
        
        // If brand user, only show their brand's leads
        if (req.user.role === 'brand' || req.user.role === 'custom_maker') {
            // Find brands owned by this user
            const brands = await Brand.find({ userId: req.user.id });
            const brandIds = brands.map(b => b._id);
            filter.brandId = { $in: brandIds };
        } else if (brandId) {
            filter.brandId = brandId;
        }

        const leads = await BrandLead.find(filter)
            .populate('brandId', 'name logo')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        return success(res, leads);
    } catch (error) {
        console.error("listBrandLeads error:", error);
        return fail(res, error, 500);
    }
};
