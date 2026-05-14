import ContractorLead from "../../models/contractorLead.js";
import Contractor from "../../models/contractor.js";
import Usertable from "../../models/user.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { sendContractorInquiryEmail } from "../../utils/emailutils.js";

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

        // Trigger notification to contractor
        try {
            const contractor = await Contractor.findById(contractorId).populate('userId');
            if (contractor) {
                const contractorEmail = contractor.contact?.email || contractor.userId?.email;
                if (contractorEmail) {
                    await sendContractorInquiryEmail(
                        { 
                            email: contractorEmail, 
                            businessName: contractor.businessName 
                        },
                        { name, phone, requirement, location }
                    );
                }
            }
        } catch (emailErr) {
            console.error("Error sending lead notification email:", emailErr);
            // Don't fail the request if email fails
        }

        return success(res, newLead, 201);

    } catch (err) {
        console.error("createContractorLead error:", err);
        return fail(res, err, 500);
    }
};

export default createContractorLead;
