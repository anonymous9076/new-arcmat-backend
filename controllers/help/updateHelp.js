import HelpQuery from "../../models/helpQueryModel.js";
import { success, fail } from "../../middlewares/responseHandler.js";

// Update query status (Admin Only)
const updateQueryStatus = async (req, res) => {
    try {
        const { queryId } = req.params;
        const { status, comment } = req.body;
        const adminId = req.user.id;

        const helpQuery = await HelpQuery.findById(queryId);
        if (!helpQuery) {
            return fail(res, { message: "Query not found" }, 404);
        }

        helpQuery.status = status;
        helpQuery.timeline.push({
            status,
            updatedBy: adminId,
            comment
        });

        await helpQuery.save();

        return success(res, helpQuery, 200, "Query status updated successfully");
    } catch (err) {
        console.error("updateQueryStatus error:", err);
        return fail(res, err, 500);
    }
};

export default updateQueryStatus;
