import Contractor from "../../models/contractor.js";
import ContractorLead from "../../models/contractorLead.js";
import Rating from "../../models/rating.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getContractorStats = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return fail(res, "User ID is required", 400);
        }

        const profile = await Contractor.findOne({ userId });

        if (!profile) {
            return fail(res, "Contractor profile not found", 404);
        }

        const contractorId = profile._id;

        // 1. Active Leads Count
        const activeLeadsCount = await ContractorLead.countDocuments({ contractorId });

        // 2. Profile Views (from model)
        const profileViews = profile.views || 0;

        // 3. Avg Rating
        const ratings = await Rating.find({ rates_to: userId });
        let avgRating = 0;
        if (ratings.length > 0) {
            let totalRatingSum = 0;
            let totalRatingCount = 0;
            
            ratings.forEach(r => {
                if (r.ratings && Array.isArray(r.ratings)) {
                    r.ratings.forEach(subRating => {
                        totalRatingSum += subRating.rating;
                        totalRatingCount++;
                    });
                }
            });
            
            if (totalRatingCount > 0) {
                avgRating = totalRatingSum / totalRatingCount;
            }
        }

        // 4. Jobs Completed (from model)
        const jobsCompleted = profile.completedProjects || 0;

        return success(res, {
            activeLeads: activeLeadsCount,
            profileViews: profileViews,
            avgRating: parseFloat(avgRating.toFixed(1)),
            jobsCompleted: jobsCompleted
        }, 200);

    } catch (error) {
        console.error("Error in getContractorStats:", error);
        return fail(res, error.message, 500);
    }
};

export default getContractorStats;
