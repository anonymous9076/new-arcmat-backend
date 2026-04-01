import Rating from "../../models/rating.js";
import { success, fail } from "../../middlewares/responseHandler.js";

/**
 * Submit multiple ratings for retailers in a project
 */
export const submitRatings = async (req, res) => {
    try {
        const { projectId, ratings } = req.body;
        const who_rates = req.user.id;

        if (!ratings || !Array.isArray(ratings)) {
            return fail(res, new Error("Missing required fields: ratings array"), 400);
        }

        const savedRatings = [];

        for (const item of ratings) {
            const { rates_to, data } = item;

            if (!rates_to || !data || !Array.isArray(data)) {
                continue;
            }

            const ratingEntry = new Rating({
                who_rates: who_rates,
                rates_to: rates_to,
                projectId: projectId,
                ratings: data
            });

            await ratingEntry.save();
            savedRatings.push(ratingEntry);
        }

        return success(res, { message: "Ratings submitted successfully", savedRatings }, 201);
    } catch (err) {
        console.error("submitRatings error:", err);
        return fail(res, err, 500);
    }
};

/**
 * Get ratings given to a specific user (retailer)
 */
export const getUserRatings = async (req, res) => {
    try {
        const { userId } = req.params;

        const ratings = await Rating.find({ rates_to: userId })
            .populate('who_rates', 'name profile')
            .sort({ createdAt: -1 });

        return success(res, { ratings }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};
