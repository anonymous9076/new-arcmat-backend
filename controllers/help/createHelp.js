import HelpQuery from "../../models/helpQueryModel.js";
import { success, fail } from "../../middlewares/responseHandler.js";

// Create a new support query
const createQuery = async (req, res) => {
    try {
        const { subject, query, attachments } = req.body;
        const userId = req.user.id;

        const newQuery = new HelpQuery({
            userId,
            subject,
            query,
            attachments: attachments || []
        });

        await newQuery.save();

        return success(res, newQuery, 201, "Support query submitted successfully");
    } catch (err) {
        console.error("createQuery error:", err);
        return fail(res, err, 500);
    }
};

export default createQuery;
