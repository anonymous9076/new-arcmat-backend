import Moodboard from "../../models/moodboard.js";
import Project from "../../models/project.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getmoodboardlist = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Check project membership
        const project = await Project.findById(projectId);
        if (!project) {
            return fail(res, new Error("Project not found"), 404);
        }

        const userEmail = req.user.email;
        const isProjectArchitect = project.architectId && project.architectId.toString() === userId.toString();
        const isInvitedClient = project.clients && project.clients.some(client =>
            (client.userId && client.userId.toString() === userId.toString() && client.status === 'Accepted') ||
            (client.email && client.email.toLowerCase() === userEmail?.toLowerCase() && client.status === 'Accepted')
        );

        if (!isAdmin && !isProjectArchitect && !isInvitedClient) {
            return fail(res, new Error("Not authorized to view moodboards for this project"), 403);
        }

        // Select _id, moodboard_name and cost details to handle intelligent adding
        // Non-admins see all boards in the project if they are members
        const moodboards = await Moodboard.find({ projectId }, "_id moodboard_name estimatedCostId")
            .populate("estimatedCostId", "productIds")
            .sort({ moodboard_name: 1 });

        return success(res, moodboards, 200);
    } catch (err) {
        console.error("getmoodboardlist error:", err);
        return fail(res, err, 500);
    }
};

export default getmoodboardlist;
