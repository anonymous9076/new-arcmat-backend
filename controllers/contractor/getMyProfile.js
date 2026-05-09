import Contractor from "../../models/contractor.js";
import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getMyProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return fail(res, "User ID is required", 400);
        }

        const profile = await Contractor.findOne({ userId });

        if (!profile) {
            return success(res, { profile: null, message: "No profile found for this user" });
        }

        const portfolio = await ContractorPortfolioItem.find({ contractorId: profile._id })
            .sort({ displayOrder: 1, createdAt: -1 });

        return success(res, { profile, portfolio });
    } catch (error) {
        console.error("getMyProfile error:", error);
        return fail(res, error.message, 500);
    }
};

export default getMyProfile;
