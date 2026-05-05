import Contractor from "../../models/contractor.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getMyProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return fail(res, "User ID is required", 400);
        }

        const profile = await Contractor.findOne({ userId })
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name');

        if (!profile) {
            return success(res, { profile: null, message: "No profile found for this user" });
        }

        return success(res, { profile });
    } catch (error) {
        console.error("getMyProfile error:", error);
        return fail(res, error.message, 500);
    }
};

export default getMyProfile;
