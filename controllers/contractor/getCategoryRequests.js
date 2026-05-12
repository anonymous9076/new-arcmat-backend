import Contractor from "../../models/contractor.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getCategoryRequests = async (req, res) => {
    try {
        // Find contractors who have specified an "Other" category or subcategory
        const contractors = await Contractor.find({
            $or: [
                { categoryId: "other" },
                { subcategoryIds: "other_sub" }
            ]
        }).select('businessName otherCategoryName otherSubcategoryName categoryId subcategoryIds updatedAt').lean();

        // Format the response to be more useful for the admin
        const requests = contractors.map(c => ({
            _id: c._id,
            businessName: c.businessName,
            requestedCategory: c.categoryId === 'other' ? c.otherCategoryName : null,
            requestedSubcategories: c.subcategoryIds?.includes('other_sub') ? c.otherSubcategoryName : null,
            updatedAt: c.updatedAt
        }));

        return success(res, requests, 200);
    } catch (err) {
        console.error("getCategoryRequests error:", err);
        return fail(res, err, 500);
    }
};

export default getCategoryRequests;
