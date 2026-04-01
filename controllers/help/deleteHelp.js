import HelpQuery from "../../models/helpQueryModel.js";
import { success, fail } from "../../middlewares/responseHandler.js";

// Delete query (Admin Only)
const deleteQuery = async (req, res) => {
    try {
        const { queryId } = req.params;

        const deleted = await HelpQuery.findByIdAndDelete(queryId);
        if (!deleted) {
            return fail(res, { message: "Query not found" }, 404);
        }

        return success(res, null, 200, "Query deleted successfully");
    } catch (err) {
        console.error("deleteQuery error:", err);
        return fail(res, err, 500);
    }
};

export default deleteQuery;
