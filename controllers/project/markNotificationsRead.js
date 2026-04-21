import mongoose from "mongoose";
import Discussion from "../../models/discussion.js";
import MaterialHistory from "../../models/materialHistory.js";
import { success, fail } from "../../middlewares/responseHandler.js";

export const markNotificationsRead = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { spaceId, materialId, type } = req.body;
        const userId = req.user.id;

        // This endpoint is ONLY for project-linked discussions.
        // For retailer chats, use POST /project/mark-retailer-read
        if (!projectId || !mongoose.isValidObjectId(projectId)) {
            return fail(res, new Error("A valid Project ID is required"), 400);
        }

        if (materialId) {
            // Mark all messages for this material in this project as read
            const discussionQuery = { projectId, referencedMaterialId: materialId, readBy: { $ne: userId } };
            if (spaceId) discussionQuery.spaceId = spaceId;
            await Discussion.updateMany(discussionQuery, { $addToSet: { readBy: userId } });

            const materialHistoryQuery = { projectId, materialId, readBy: { $ne: userId } };
            if (spaceId) materialHistoryQuery.spaceId = spaceId;
            await MaterialHistory.updateMany(materialHistoryQuery, { $addToSet: { readBy: userId } });

        } else if (type === 'general') {
            // NUCLEAR SWEEP: Mark EVERYTHING in this project as read for this user.
            // This ensures no 'ghost' notifications remain in any room or thread.
            const discussionQuery = { 
                projectId, 
                readBy: { $ne: userId } 
            };
            const historyQuery = { 
                projectId, 
                readBy: { $ne: userId } 
            };

            await Discussion.updateMany(discussionQuery, { $addToSet: { readBy: userId } });
            await MaterialHistory.updateMany(historyQuery, { $addToSet: { readBy: userId } });
        } else {
            // Default: mark all non-retailer messages in project as read
            const discussionQuery = { projectId, retailerId: null, readBy: { $ne: userId } };
            if (spaceId) discussionQuery.spaceId = spaceId;
            await Discussion.updateMany(discussionQuery, { $addToSet: { readBy: userId } });

            const historyQuery = { projectId, readBy: { $ne: userId } };
            if (spaceId) historyQuery.spaceId = spaceId;
            await MaterialHistory.updateMany(historyQuery, { $addToSet: { readBy: userId } });
        }

        return success(res, { message: "Notifications marked as read" }, 200);
    } catch (err) {
        console.error("markNotificationsRead error:", err);
        return fail(res, new Error(err.message || "Internal error"), 500);
    }
};

export default markNotificationsRead;