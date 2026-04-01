import Project from "../../models/project.js";
import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import ProjectTemplate from "../../models/projectTemplate.js";
import MoodboardTemplate from "../../models/moodboardTemplate.js";
import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const createTemplateFromProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        const project = await Project.findById(projectId);
        if (!project) {
            return fail(res, new Error("Project not found"), 404);
        }

        // 1. Create Project Template
        const templateData = {
            creatorId: userId,
            templateName: `${project.projectName} Template`,
            type: project.type,
            size: project.size,
            description: project.description,
            coverImage: project.coverImage
        };
        const projectTemplate = await ProjectTemplate.create(templateData);

        // 2. Fetch all Moodboards for this project
        const moodboards = await Moodboard.find({ projectId });

        for (const moodboard of moodboards) {
            // 3. Create Moodboard Template
            const mbTemplateData = {
                templateId: projectTemplate._id,
                userId: userId,
                moodboard_name: moodboard.moodboard_name,
                canvasState: moodboard.canvasState,
                totalBudget: moodboard.totalBudget,
                coverImage: moodboard.coverImage,
                productMetadata: moodboard.productMetadata,
                customPhotos: moodboard.customPhotos,
                customRows: moodboard.customRows,
                canvasBackgroundColor: moodboard.canvasBackgroundColor
            };
            const moodboardTemplate = await MoodboardTemplate.create(mbTemplateData);

            // 4. Fetch Estimated Cost for this moodboard
            const estimatedCost = await EstimatedCost.findOne({ moodboardId: moodboard._id });

            const ecTemplateData = {
                templateId: projectTemplate._id,
                moodboardTemplateId: moodboardTemplate._id,
                productIds: estimatedCost ? estimatedCost.productIds : [],
                costing: estimatedCost ? estimatedCost.costing : 0
            };
            await EstimatedCostTemplate.create(ecTemplateData);
        }

        return success(res, projectTemplate, 201);
    } catch (err) {
        console.error("createTemplateFromProject error:", err);
        return fail(res, err, 500);
    }
};

export default createTemplateFromProject;
