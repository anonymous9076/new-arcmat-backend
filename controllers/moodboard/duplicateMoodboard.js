import Moodboard from "../../models/moodboard.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const duplicatemoodboard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const original = await Moodboard.findById(id);
        if (!original) {
            return fail(res, new Error("Original space not found"), 404);
        }

        // Create a copy of the space structure
        const duplicateData = {
            projectId: original.projectId,
            userId,
            moodboard_name: `${original.moodboard_name} (Copy)`,
            customRows: original.customRows || [],
            productMetadata: original.productMetadata || {},
            canvasBackgroundColor: original.canvasBackgroundColor,
            showPriceToClient: original.showPriceToClient,
            canvasState: original.canvasState || [],
            customPhotos: original.customPhotos || [],
            totalBudget: original.totalBudget || 0,
            coverImage: original.coverImage || null
        };

        const newMoodboard = await Moodboard.create(duplicateData);

        return success(res, newMoodboard, 201);
    } catch (err) {
        console.error("duplicatemoodboard error:", err);
        return fail(res, err, 500);
    }
};

export default duplicatemoodboard;
