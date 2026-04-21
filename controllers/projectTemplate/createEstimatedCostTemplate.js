import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import ProjectTemplate from "../../models/projectTemplate.js";
import MoodboardTemplate from "../../models/moodboardTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const createEstimatedCostTemplate = async (req, res) => {
    try {
        const { templateId, moodboardTemplateId, productIds, costing } = req.body;
        const userId = req.user.id;
        const role = req.user.role;

        if (!templateId || !moodboardTemplateId) {
            return fail(res, "templateId and moodboardTemplateId are required", 400);
        }

        const [template, moodboardTemplate] = await Promise.all([
            ProjectTemplate.findById(templateId).select("creatorId"),
            MoodboardTemplate.findById(moodboardTemplateId).select("templateId"),
        ]);

        if (!template || !moodboardTemplate) {
            return fail(res, "Template or template space not found", 404);
        }

        const isOwner = template.creatorId && template.creatorId.toString() === userId.toString();
        if (role !== "admin" && !isOwner) {
            return fail(res, "Unauthorized to create template costings for this template", 403);
        }

        if (moodboardTemplate.templateId.toString() !== templateId.toString()) {
            return fail(res, "Template space does not belong to the selected template", 400);
        }

        // Check if estimation already exists for this space
        const existing = await EstimatedCostTemplate.findOne({ moodboardTemplateId });
        if (existing) {
            return fail(res, "Estimation record already exists for this template space", 400);
        }

        const newEstimation = await EstimatedCostTemplate.create({
            templateId,
            moodboardTemplateId,
            productIds: productIds || [],
            costing: costing || 0
        });

        return success(res, newEstimation, 201);
    } catch (error) {
        console.error("Error in createEstimatedCostTemplate:", error);
        return fail(res, error, 500);
    }
};

export default createEstimatedCostTemplate;
