import Project from "../../models/project.js";
import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import ProjectTemplate from "../../models/projectTemplate.js";
import MoodboardTemplate from "../../models/moodboardTemplate.js";
import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const useTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user.id;
        const { projectName, clientName } = req.body;

        const template = await ProjectTemplate.findById(templateId);
        if (!template) {
            return fail(res, new Error("Template not found"), 404);
        }

        // 1. Create new Project from template
        const projectData = {
            architectId: userId,
            projectName: projectName || `${template.templateName} Copy`,
            clientName: clientName || '',
            type: template.type,
            size: template.size,
            description: template.description,
            coverImage: template.coverImage,
            status: 'Active',
            phase: 'Concept Design'
        };
        const newProject = await Project.create(projectData);

        // 2. Fetch all MoodboardTemplates for this template
        const mbTemplates = await MoodboardTemplate.find({ templateId });

        for (const mbTemplate of mbTemplates) {
            // 3. Create new Moodboard from template
            const moodboardData = {
                projectId: newProject._id,
                userId: userId,
                moodboard_name: mbTemplate.moodboard_name,
                canvasState: mbTemplate.canvasState,
                totalBudget: mbTemplate.totalBudget,
                coverImage: mbTemplate.coverImage,
                productMetadata: mbTemplate.productMetadata,
                customPhotos: mbTemplate.customPhotos,
                customRows: mbTemplate.customRows,
                canvasBackgroundColor: mbTemplate.canvasBackgroundColor
            };
            const newMoodboard = await Moodboard.create(moodboardData);

            // 4. Fetch EstimatedCostTemplate for this mbTemplate
            const ecTemplate = await EstimatedCostTemplate.findOne({ moodboardTemplateId: mbTemplate._id });
            if (ecTemplate) {
                const ecData = {
                    projectId: newProject._id,
                    moodboardId: newMoodboard._id,
                    productIds: ecTemplate.productIds,
                    costing: ecTemplate.costing
                };
                const newEstimatedCost = await EstimatedCost.create(ecData);

                // Update moodboard with estimatedCostId
                newMoodboard.estimatedCostId = newEstimatedCost._id;
                await newMoodboard.save();
            }
        }

        return success(res, newProject, 201);
    } catch (err) {
        console.error("useTemplate error:", err);
        return fail(res, err, 500);
    }
};

export default useTemplate;
