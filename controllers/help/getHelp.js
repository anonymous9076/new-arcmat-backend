import HelpQuery from "../../models/helpQueryModel.js";
import { success, fail } from "../../middlewares/responseHandler.js";

// Get queries (User sees own, Admin sees all)
const getQueries = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const query = isAdmin ? {} : { userId };

        const queries = await HelpQuery.find(query)
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });

        return success(res, queries, 200);
    } catch (err) {
        console.error("getQueries error:", err);
        return fail(res, err, 500);
    }
};

export default getQueries;
