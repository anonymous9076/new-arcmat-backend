import mongoose from "mongoose";
import Discussion from "../../models/discussion.js";
import MaterialHistory from "../../models/materialHistory.js";
import { success, fail } from "../../middlewares/responseHandler.js";

export const markNotificationsRead = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { spaceId, materialId, type } = req.body;
        const userId = req.user._id || req.user.id;

        if (!projectId || !mongoose.isValidObjectId(projectId)) {
            return fail(res, new Error("A valid Project ID is required"), 400);
        }

        const projectObjectId = new mongoose.Types.ObjectId(projectId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        if (materialId) {
            // Mark all messages for this material in this project as read
            const discussionQuery = { 
                projectId: projectObjectId, 
                referencedMaterialId: materialId, 
                readBy: { $ne: userObjectId } 
            };
            if (spaceId && mongoose.isValidObjectId(spaceId)) {
                discussionQuery.spaceId = new mongoose.Types.ObjectId(spaceId);
            }
            
            await Discussion.updateMany(discussionQuery, { $addToSet: { readBy: userObjectId } });

            const materialHistoryQuery = { 
                projectId: projectObjectId, 
                materialId, 
                readBy: { $ne: userObjectId } 
            };
            if (spaceId && mongoose.isValidObjectId(spaceId)) {
                materialHistoryQuery.spaceId = new mongoose.Types.ObjectId(spaceId);
            }
            await MaterialHistory.updateMany(materialHistoryQuery, { $addToSet: { readBy: userObjectId } });

        } else if (type === 'general') {
            // NUCLEAR SWEEP: Mark EVERYTHING in this project as read for this user.
            const discussionQuery = { 
                projectId: projectObjectId, 
                readBy: { $ne: userObjectId } 
            };
            const historyQuery = { 
                projectId: projectObjectId, 
                readBy: { $ne: userObjectId } 
            };

            await Discussion.updateMany(discussionQuery, { $addToSet: { readBy: userObjectId } });
            await MaterialHistory.updateMany(historyQuery, { $addToSet: { readBy: userObjectId } });
        } else {
            // Default: mark all non-retailer messages in project as read
            const discussionQuery = { 
                projectId: projectObjectId, 
                retailerId: null, 
                readBy: { $ne: userObjectId } 
            };
            if (spaceId && mongoose.isValidObjectId(spaceId)) {
                discussionQuery.spaceId = new mongoose.Types.ObjectId(spaceId);
            }
            await Discussion.updateMany(discussionQuery, { $addToSet: { readBy: userObjectId } });

            const historyQuery = { 
                projectId: projectObjectId, 
                readBy: { $ne: userObjectId } 
            };
            if (spaceId && mongoose.isValidObjectId(spaceId)) {
                historyQuery.spaceId = new mongoose.Types.ObjectId(spaceId);
            }
            await MaterialHistory.updateMany(historyQuery, { $addToSet: { readBy: userObjectId } });
        }

        return success(res, { message: "Notifications marked as read" }, 200);
    } catch (err) {
        console.error("markNotificationsRead error:", err);
        return fail(res, new Error(err.message || "Internal error"), 500);
    }
};

export default markNotificationsRead;