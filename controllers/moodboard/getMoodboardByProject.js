import Moodboard from "../../models/moodboard.js";
import Project from "../../models/project.js";
import Discussion from "../../models/discussion.js";
import MaterialHistory from "../../models/materialHistory.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getmoodboardbyproject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;
        const isAdmin = role === 'admin';
        const isArchitect = role === 'architect';
        const isClient = role === 'customer';

        const project = await Project.findById(projectId);
        if (!project) {
            return fail(res, new Error("Project not found"), 404);
        }

        const userEmail = req.user.email;
        const isProjectArchitect = project.architectId && project.architectId.toString() === userId.toString();
        const isInvitedClient = project.clients && project.clients.some(client =>
            (client.userId && client.userId.toString() === userId.toString() && client.status === 'Accepted') ||
            (client.email && client.email.toLowerCase() === userEmail?.toLowerCase() && client.status === 'Accepted')
        );

        if (!isAdmin && !isProjectArchitect && !isInvitedClient) {
            return fail(res, new Error("Not authorized to view moodboards for this project"), 403);
        }

        const moodboards = await Moodboard.find({ projectId })
            .populate("projectId")
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
            .sort({ createdAt: -1 })
            .lean();

        // Attach counts to each moodboard
        const moodboardsWithBadges = await Promise.all(moodboards.map(async (mb) => {
            // Calculate moodboard-specific unread discussions
            const discussionQuery = {
                projectId,
                spaceId: mb._id,
                readBy: { $ne: userId }
            };
            if (isClient) discussionQuery.isInternal = { $ne: true };
            const unreadMessagesCount = await Discussion.countDocuments(discussionQuery);

            const pendingApprovalsCount = await MaterialHistory.countDocuments({
                projectId,
                spaceId: mb._id,
                approvalStatus: 'Pending',
                readBy: { $ne: userId }
            });

            return {
                ...mb,
                unreadMessages: unreadMessagesCount,
                pendingApprovals: pendingApprovalsCount
            };
        }));

        return success(res, moodboardsWithBadges, 200);
    } catch (err) {
        console.error("getmoodboardbyproject error:", err);
        return fail(res, err, 500);
    }
};

export default getmoodboardbyproject;
