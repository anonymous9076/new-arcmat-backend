import EstimatedCost from "../../models/estimatedCost.js";
import Moodboard from "../../models/moodboard.js";
import RetailerProduct from "../../models/retailerproduct.js";
import Project from "../../models/project.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const calculateTotalCost = async (retailerProductIds) => {
    if (!retailerProductIds || retailerProductIds.length === 0) return { total: 0, retailerIds: [] };

    // Fetch all retailer products in one query
    const retailerProducts = await RetailerProduct.find({
        _id: { $in: retailerProductIds }
    }).select('selling_price retailerId');

    // Sum the selling prices
    const total = retailerProducts.reduce((sum, rp) => sum + (rp.selling_price || 0), 0);

    // Extract unique retailer IDs
    const retailerIds = Array.from(new Set(retailerProducts.map(rp => rp.retailerId?.toString()))).filter(Boolean);

    return { total, retailerIds };
};

const createestimatedcost = async (req, res) => {
    try {
        const { projectId, moodboardId, productIds } = req.body;

        if (!projectId || !moodboardId || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return fail(res, new Error("projectId, moodboardId, and at least one productId are required"), 400);
        }

        // Verify Moodboard exists
        const moodboard = await Moodboard.findById(moodboardId);
        if (!moodboard) {
            return fail(res, new Error("Moodboard not found"), 404);
        }

        const { total: costing, retailerIds } = await calculateTotalCost(productIds);

        const newEstimatedCost = await EstimatedCost.create({
            projectId,
            moodboardId,
            productIds,
            costing
        });

        // Update Moodboard with the new estimatedCostId
        await Moodboard.findByIdAndUpdate(moodboardId, { estimatedCostId: newEstimatedCost._id });

        // Link retailers to the project
        if (retailerIds && retailerIds.length > 0) {
            await Project.findByIdAndUpdate(projectId, {
                $addToSet: { retailers: { $each: retailerIds } }
            });
        }

        return success(res, newEstimatedCost, 201);
    } catch (err) {
        console.error("createestimatedcost error:", err);
        return fail(res, err, 500);
    }
};

export { createestimatedcost, calculateTotalCost };
