import Contractor from "../../models/contractor.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const updateContractorProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        
        // Sanitize empty strings for ObjectIds to prevent cast errors
        if (updates.categoryId === "") updates.categoryId = null;
        if (updates.subcategoryId === "") updates.subcategoryId = null;

        const contractor = await Contractor.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!contractor) {
            return fail(res, "Contractor not found", 404);
        }

        return success(res, contractor, 200);

    } catch (err) {
        console.error("updateContractorProfile error:", err);
        return fail(res, err, 500);
    }
};

export default updateContractorProfile;
