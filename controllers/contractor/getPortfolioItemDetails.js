import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getPortfolioItemDetails = async (req, res) => {
    try {
        const { itemId } = req.params;

        const portfolioItem = await ContractorPortfolioItem.findById(itemId).populate({
            path: 'contractorId',
            select: 'businessName profileImage slug contact'
        });

        if (!portfolioItem) {
            return fail(res, "Project not found", 404);
        }

        return success(res, portfolioItem, 200);
    } catch (error) {
        console.error("getPortfolioItemDetails error:", error);
        return fail(res, error, 500);
    }
};

export default getPortfolioItemDetails;
