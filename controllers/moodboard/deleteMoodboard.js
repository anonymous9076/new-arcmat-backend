import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const deletemoodboard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isArchitect = req.user.role === 'architect';

        if (!isAdmin && !isArchitect) {
            return fail(res, new Error("Only architects or admins can delete spaces"), 403);
        }

        let query = { _id: id };
        if (!isAdmin) {
            // If architect, they must be the owner of the moodboard or have permissions
            // For now, we assume architects can delete moodboards they created or are assigned to
            query.userId = userId;
        }

        const deletedMoodboard = await Moodboard.findOneAndDelete(query);

        if (!deletedMoodboard) {
            return fail(res, new Error("Moodboard not found or not authorized"), 404);
        }

        // Cascade Deletion: Delete associated EstimatedCost if it exists
        if (deletedMoodboard.estimatedCostId) {
            await EstimatedCost.findByIdAndDelete(deletedMoodboard.estimatedCostId);
        }

        return success(res, { message: "Moodboard and its estimated cost deleted successfully" }, 200);
    } catch (err) {
        console.error("deletemoodboard error:", err);
        return fail(res, err, 500);
    }
};

export default deletemoodboard;
