import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import ProjectTemplate from "../../models/projectTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateEstimatedCostTemplate = async (req, res) => {
    try {
        const { costId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const costRecord = await EstimatedCostTemplate.findById(costId).select("templateId");
        if (!costRecord) {
            return fail(res, "Estimated cost template not found", 404);
        }

        const template = await ProjectTemplate.findById(costRecord.templateId).select("creatorId");
        if (!template) {
            return fail(res, "Template not found", 404);
        }

        const isOwner = template.creatorId && template.creatorId.toString() === userId.toString();
        if (role !== "admin" && !isOwner) {
            return fail(res, "Unauthorized to update this template cost", 403);
        }

        const updates = {};
        if (req.body.productIds !== undefined) updates.productIds = req.body.productIds;
        if (req.body.costing !== undefined) updates.costing = req.body.costing;

        const cost = await EstimatedCostTemplate.findOneAndUpdate(
            { _id: costId, templateId: costRecord.templateId },
            updates,
            { new: true }
        );

        return success(res, cost, 200);
    } catch (error) {
        console.error("Error in updateEstimatedCostTemplate:", error);
        return fail(res, error, 500);
    }
};

export default updateEstimatedCostTemplate;
