import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const createEstimatedCostTemplate = async (req, res) => {
    try {
        const { templateId, moodboardTemplateId, productIds, costing } = req.body;

        if (!templateId || !moodboardTemplateId) {
            return fail(res, "templateId and moodboardTemplateId are required", 400);
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
