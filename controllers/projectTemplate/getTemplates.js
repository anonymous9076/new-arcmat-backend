import ProjectTemplate from "../../models/projectTemplate.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getTemplates = async (req, res) => {
    try {
        const userId = req.user.id;
        const templates = await ProjectTemplate.find({ creatorId: userId }).sort({ createdAt: -1 });
        return success(res, templates, 200);
    } catch (err) {
        console.error("getTemplates error:", err);
        return fail(res, err, 500);
    }
};

export default getTemplates;
