import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateEstimatedCostTemplate = async (req, res) => {
    try {
        const { costId } = req.params;
        const updates = req.body;

        const cost = await EstimatedCostTemplate.findOneAndUpdate(
            { _id: costId },
            updates,
            { new: true }
        );

        if (!cost) {
            return fail(res, "Estimated cost template not found", 404);
        }

        return success(res, cost, 200);
    } catch (error) {
        console.error("Error in updateEstimatedCostTemplate:", error);
        return fail(res, error, 500);
    }
};

export default updateEstimatedCostTemplate;
