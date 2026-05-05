import ContractorLead from "../../models/contractorLead.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const createContractorLead = async (req, res) => {
    try {
        const { contractorId, name, phone, requirement, location } = req.body;

        if (!contractorId || !name || !phone || !requirement || !location) {
            return fail(res, "Missing required fields: contractorId, name, phone, requirement, location", 400);
        }

        const newLead = new ContractorLead({
            ...req.body,
            status: 'new'
        });

        await newLead.save();

        // TODO: Trigger notification to contractor here

        return success(res, newLead, 201);

    } catch (err) {
        console.error("createContractorLead error:", err);
        return fail(res, err, 500);
    }
};

export default createContractorLead;
