import Contractor from "../../models/contractor.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getContractorDebug = async (req, res) => {
    try {
        const total = await Contractor.countDocuments();
        const publicCount = await Contractor.countDocuments({ visibility: 'public' });
        const privateCount = await Contractor.countDocuments({ visibility: 'private' });
        const approvedCount = await Contractor.countDocuments({ status: 'approved' });
        const sample = await Contractor.findOne().lean();

        return success(res, {
            total,
            publicCount,
            privateCount,
            approvedCount,
            sample: sample ? {
                _id: sample._id,
                businessName: sample.businessName,
                slug: sample.slug,
                visibility: sample.visibility,
                status: sample.status,
                hasUserId: !!sample.userId
            } : null
        }, 200);
    } catch (err) {
        return fail(res, err.message, 500);
    }
};

export default getContractorDebug;
