import MoodboardTemplate from "../../models/moodboardTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateMoodboardTemplate = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const userId = req.user.id || req.user._id;
        const updates = req.body;

        const board = await MoodboardTemplate.findOneAndUpdate(
            { _id: spaceId, userId },
            updates,
            { new: true }
        );

        if (!board) {
            return fail(res, "Moodboard template not found", 404);
        }

        return success(res, board, 200);
    } catch (error) {
        console.error("Error in updateMoodboardTemplate:", error);
        return fail(res, error, 500);
    }
};

export default updateMoodboardTemplate;
