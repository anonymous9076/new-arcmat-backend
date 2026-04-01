import EstimatedCost from "../../models/estimatedCost.js";
import Moodboard from "../../models/moodboard.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const deleteestimatedcost = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await EstimatedCost.findByIdAndDelete(id);

        if (!deleted) {
            return fail(res, new Error("Estimated cost not found"), 404);
        }

        // Clear reference in Moodboard
        await Moodboard.findOneAndUpdate(
            { estimatedCostId: id },
            { estimatedCostId: null }
        );

        return success(res, { message: "Estimated cost deleted successfully" }, 200);
    } catch (err) {
        console.error("deleteestimatedcost error:", err);
        return fail(res, err, 500);
    }
};

export default deleteestimatedcost;
