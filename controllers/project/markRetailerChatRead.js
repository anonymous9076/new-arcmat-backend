import mongoose from "mongoose";
import Discussion from "../../models/discussion.js";
import { success, fail } from "../../middlewares/responseHandler.js";

/**
 * Mark all messages in a retailer chat thread as read.
 * Identifies the thread by retailerId + materialId (no projectId required).
 * This endpoint is used by BOTH architects and retailers.
 */
export const markRetailerChatRead = async (req, res) => {
    try {
        const { retailerId, materialId } = req.body;
        const userId = req.user.id;

        if (!retailerId || !materialId) {
            return fail(res, new Error("retailerId and materialId are required"), 400);
        }

        // Mark all messages in this thread (identified by retailerId + materialId)
        // as read for the calling user. We intentionally do NOT filter by projectId
        // so this works for both project-linked and project-less chats.
        const result = await Discussion.updateMany(
            {
                retailerId: new mongoose.Types.ObjectId(retailerId),
                referencedMaterialId: materialId,
                readBy: { $ne: userId },
                isInternal: true,
            },
            { $addToSet: { readBy: userId } }
        );

        console.log(`[markRetailerChatRead] userId=${userId}, retailerId=${retailerId}, materialId=${materialId} → modified=${result.modifiedCount}`);

        return success(res, { message: "Retailer chat marked as read", modified: result.modifiedCount }, 200);
    } catch (err) {
        console.error("markRetailerChatRead error:", err);
        return fail(res, new Error(err.message || "Failed to mark retailer chat as read"), 500);
    }
};

export default markRetailerChatRead;
