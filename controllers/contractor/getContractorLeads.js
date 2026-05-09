import ContractorLead from "../../models/contractorLead.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getContractorLeads = async (req, res) => {
    try {
        const { contractorId } = req.params;

        if (!contractorId) {
            return fail(res, "Contractor ID is required", 400);
        }

        const leads = await ContractorLead.find({ contractorId })
            .sort({ createdAt: -1 })
            .populate('requesterId', 'name email phone');

        return success(res, leads, 200);
    } catch (error) {
        console.error("Error in getContractorLeads:", error);
        return fail(res, error.message, 500);
    }
};

export default getContractorLeads;
