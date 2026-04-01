import Project from "../../models/project.js";
import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Delete a project belonging to the authenticated architect.
 */
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const architectId = req.user.id;

        const project = await Project.findOneAndDelete({ _id: id, architectId });

        if (!project) {
            return fail(res, new Error("Project not found or access denied"), 404);
        }

        // Cascade Deletion: Clean up associated Moodboards and EstimatedCosts
        try {
            // Delete all EstimatedCosts linked to this project
            await EstimatedCost.deleteMany({ projectId: id });

            // Delete all Moodboards linked to this project
            await Moodboard.deleteMany({ projectId: id });

        } catch (cascadeErr) {
            console.error("Cascade deletion error for Project:", cascadeErr);
            // We don't fail the main request since the project itself is already deleted,
            // but we log it for debugging.
        }

        return success(res, { message: "Project and all associated data deleted successfully" }, 200);
    } catch (err) {
        console.error("deleteProject error:", err);
        return fail(res, err, 500);
    }
};

export default deleteProject;
