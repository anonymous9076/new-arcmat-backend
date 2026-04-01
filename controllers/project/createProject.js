import Project from "../../models/project.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Create a new project for the authenticated architect.
 */
const createProject = async (req, res) => {
    try {
        let { projectName, clientName, location, type, phase, size, description, estimatedDuration, budget } = req.body;
        const architectId = req.user.id;

        if (!projectName) {
            return fail(res, new Error("Project name is required"), 400);
        }

        // Normalize spaces: trim and collapse multiple internal spaces
        projectName = projectName.trim().replace(/\s+/g, ' ');

        const newProject = new Project({
            architectId,
            projectName,
            clientName,
            location,
            type,
            phase,
            size,
            description,
            estimatedDuration,
            budget,
        });

        const savedProject = await newProject.save();
        return success(res, savedProject, 201);
    } catch (err) {
        console.error("createProject error:", err);
        return fail(res, err, 500);
    }
};

export default createProject;
