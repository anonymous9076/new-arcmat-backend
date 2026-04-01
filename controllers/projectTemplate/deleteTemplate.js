import ProjectTemplate from "../../models/projectTemplate.js";
import MoodboardTemplate from "../../models/moodboardTemplate.js";
import EstimatedCostTemplate from "../../models/estimatedCostTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const deleteTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.user.id;

        const template = await ProjectTemplate.findOne({ _id: templateId, creatorId: userId });
        if (!template) {
            return fail(res, new Error("Template not found or unauthorized"), 404);
        }

        await EstimatedCostTemplate.deleteMany({ templateId });
        await MoodboardTemplate.deleteMany({ templateId });
        await ProjectTemplate.deleteOne({ _id: templateId });

        return success(res, { message: "Template deleted successfully" }, 200);
    } catch (err) {
        console.error("deleteTemplate error:", err);
        return fail(res, err, 500);
    }
};

export default deleteTemplate;
