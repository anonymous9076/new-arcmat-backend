import Contractor from "../../models/contractor.js";
import Usertable from "../../models/user.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const createContractorProfile = async (req, res) => {
    try {
        const { userId, businessName, providerType, categoryId, subcategoryId } = req.body;

        if (!userId || !businessName || !providerType) {
            return fail(res, "Missing required fields: userId, businessName, providerType", 400);
        }

        // Sanitize empty strings for ObjectIds to prevent cast errors
        const sanitizedData = { ...req.body };
        if (sanitizedData.categoryId === "") delete sanitizedData.categoryId;
        if (sanitizedData.subcategoryId === "") delete sanitizedData.subcategoryId;
        if (Array.isArray(sanitizedData.serviceIds)) {
            sanitizedData.serviceIds = sanitizedData.serviceIds.filter(id => id !== "");
        }

        // Check if user already has a profile
        const existingProfile = await Contractor.findOne({ userId });
        if (existingProfile) {
            return fail(res, "User already has a contractor profile", 400);
        }

        // Generate initial slug from business name
        const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        
        // Ensure slug is unique
        let finalSlug = slug;
        let counter = 1;
        while (await Contractor.findOne({ slug: finalSlug })) {
            finalSlug = `${slug}-${counter}`;
            counter++;
        }

        const newContractor = new Contractor({
            ...sanitizedData,
            slug: finalSlug,
            status: 'draft' // Initial status is draft
        });

        await newContractor.save();

        // Update User record with reference
        await Usertable.findByIdAndUpdate(userId, {
            contractorProfile: newContractor._id,
            providerType: providerType
        });

        return success(res, newContractor, 201);

    } catch (err) {
        console.error("createContractorProfile error:", err);
        return fail(res, err, 500);
    }
};

export default createContractorProfile;
