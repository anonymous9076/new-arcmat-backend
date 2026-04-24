import Moodboard from "../../models/moodboard.js";
import Project from "../../models/project.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getallarchitectboards = async (req, res) => {
    try {
        const authUserId = req.user.id;
        const role = req.user.role;
        const isAdmin = role === 'admin';
        const isArchitect = role === 'architect';
        const isClient = role === 'customer';

        let query = {};

        if (isAdmin) {
            query = {};
        } else if (isArchitect) {
            query = { userId: authUserId };
        } else if (isClient) {
            // Clients see moodboards from projects they are INVITED to and have ACCEPTED
            const sharedProjects = await Project.find({
                'clients.userId': authUserId,
                'clients.status': 'Accepted'
            }).select('_id');

            const projectIds = sharedProjects.map(p => p._id);
            query = { projectId: { $in: projectIds } };
        } else {
            // Other roles see boards they created
            query = { userId: authUserId };
        }

        const moodboards = await Moodboard.find(query)
            .populate("projectId", "projectName")
            .populate({
                path: "estimatedCostId",
                model: "EstimatedCost",
                populate: {
                    path: "productIds",
                    model: "RetailerProduct",
                    populate: {
                        path: "productId",
                        model: "Product",
                        select: "product_name product_images images"
                    }
                }
            })
            .sort({ createdAt: -1 }) // Newest first
            .lean();

        return success(res, moodboards, 200);
    } catch (err) {
        console.error("getallarchitectboards error:", err);
        return fail(res, err, 500);
    }
};

export default getallarchitectboards;
