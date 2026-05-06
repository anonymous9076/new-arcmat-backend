import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const deletePortfolioItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const item = await ContractorPortfolioItem.findByIdAndDelete(itemId);

        if (!item) {
            return fail(res, "Portfolio item not found", 404);
        }

        return success(res, { message: "Portfolio item deleted" });
    } catch (error) {
        console.error("deletePortfolioItem error:", error);
        return fail(res, error, 500);
    }
};

export default deletePortfolioItem;
