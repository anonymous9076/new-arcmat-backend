import Moodboard from "../../models/moodboard.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const createmoodboard = async (req, res) => {
    try {
        let { projectId, moodboard_name } = req.body;
        const userId = req.user.id;

        if (!projectId || !moodboard_name) {
            return fail(res, new Error("projectId and moodboard_name are required"), 400);
        }

        // Normalize moodboard_name: trim and collapse spaces
        moodboard_name = moodboard_name.trim().replace(/\s+/g, ' ');

        const newMoodboard = await Moodboard.create({
            projectId,
            moodboard_name,
            userId,
        });

        return success(res, newMoodboard, 201);
    } catch (err) {
        console.error("createmoodboard error:", err);
        return fail(res, err, 500);
    }
};

export default createmoodboard;
