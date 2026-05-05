import Contractor from "../../models/contractor.js";
import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getContractorDetails = async (req, res) => {
    try {
        const { slug } = req.params;

        const contractor = await Contractor.findOne({ slug })
            .populate("categoryId", "name image description")
            .populate("subcategoryId", "name")
            .populate("userId", "name profile")
            .lean();

        if (!contractor) {
            return fail(res, "Contractor not found", 404);
        }

        // Fetch portfolio items
        const portfolio = await ContractorPortfolioItem.find({ contractorId: contractor._id })
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();

        contractor.portfolio = portfolio;

        return success(res, contractor, 200);

    } catch (err) {
        console.error("getContractorDetails error:", err);
        return fail(res, err, 500);
    }
};

export default getContractorDetails;
