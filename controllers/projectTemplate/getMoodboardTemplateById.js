import MoodboardTemplate from "../../models/moodboardTemplate.js";
import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getMoodboardTemplateById = async (req, res) => {
    try {
        const { spaceId } = req.params;
        const userId = req.user.id || req.user._id;

        const board = await MoodboardTemplate.findOne({ _id: spaceId, userId })
            .populate({
                path: 'templateId',
                select: 'templateName creatorId'
            });

        if (!board) {
            return fail(res, "Moodboard template not found", 404);
        }

        // Fetch associated estimated cost with deep population (same as regular moodboard)
        const estimation = await EstimatedCostTemplate.findOne({ moodboardTemplateId: spaceId })
            .populate({
                path: 'productIds',
                model: 'RetailerProduct',
                populate: [
                    {
                        path: 'productId',
                        model: 'Product',
                        populate: { path: 'brand categoryId subcategoryId' }
                    },
                    {
                        path: 'variantId',
                        model: 'variant'
                    }
                ]
            });

        return success(res, {
            ...board.toObject(),
            estimation
        }, 200);
    } catch (error) {
        console.error("Error in getMoodboardTemplateById:", error);
        return fail(res, error, 500);
    }
};

export default getMoodboardTemplateById;
