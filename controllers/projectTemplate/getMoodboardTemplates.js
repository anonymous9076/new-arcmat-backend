import MoodboardTemplate from "../../models/moodboardTemplate.js";
import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getMoodboardTemplates = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user.id || req.user._id;

        const boards = await MoodboardTemplate.find({ templateId, userId }).sort({ createdAt: -1 });

        // Deep-populate products so the frontend can extract thumbnails for the 2x2 image grid
        const boardsWithEstimation = await Promise.all(boards.map(async (board) => {
            const estimation = await EstimatedCostTemplate.findOne({ moodboardTemplateId: board._id })
                .populate({
                    path: 'productIds',
                    model: 'RetailerProduct',
                    populate: [
                        {
                            path: 'productId',
                            model: 'Product',
                            populate: { path: 'brand' }
                        },
                        {
                            path: 'variantId',
                            model: 'variant'
                        }
                    ]
                });
            return {
                ...board.toObject(),
                estimation
            };
        }));

        return success(res, boardsWithEstimation, 200);
    } catch (error) {
        console.error("Error in getMoodboardTemplates:", error);
        return fail(res, error, 500);
    }
};

export default getMoodboardTemplates;
