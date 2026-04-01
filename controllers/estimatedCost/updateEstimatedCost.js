import EstimatedCost from "../../models/estimatedCost.js";
import Moodboard from "../../models/moodboard.js";
import Project from "../../models/project.js";
import { calculateTotalCost } from "./createEstimatedCost.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateestimatedcost = async (req, res) => {
    try {
        const { id } = req.params;
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds)) {
            return fail(res, new Error("productIds array is required"), 400);
        }

        // Fetch the EstimatedCost to get the projectId
        const estimatedCost = await EstimatedCost.findById(id);
        if (!estimatedCost) {
            return fail(res, new Error("Estimated cost not found"), 404);
        }

        const projectId = estimatedCost.projectId;

        // If all products are removed, delete the EstimatedCost
        if (productIds.length === 0) {
            const deleted = await EstimatedCost.findByIdAndDelete(id);
            if (deleted) {
                await Moodboard.findOneAndUpdate(
                    { estimatedCostId: id },
                    { estimatedCostId: null }
                );
            }
            return success(res, { message: "Estimated cost deleted because all products were removed" }, 200);
        }

        const { total: costing, retailerIds } = await calculateTotalCost(productIds);

        const updated = await EstimatedCost.findByIdAndUpdate(
            id,
            { productIds, costing },
            { new: true, runValidators: true }
        );

        // Sync retailers with project
        if (retailerIds && retailerIds.length > 0) {
            await Project.findByIdAndUpdate(projectId, {
                $addToSet: { retailers: { $each: retailerIds } }
            });
        }

        return success(res, updated, 200);
    } catch (err) {
        console.error("updateestimatedcost error:", err);
        return fail(res, err, 500);
    }
};

export default updateestimatedcost;
