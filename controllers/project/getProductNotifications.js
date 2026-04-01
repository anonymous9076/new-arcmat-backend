import Discussion from "../../models/discussion.js";
import MaterialHistory from "../../models/materialHistory.js";
import { success, fail } from "../../middlewares/responseHandler.js";

export const getProductNotifications = async (req, res) => {
    try {
        const { id: projectId, spaceId } = req.params;
        const userId = req.user.id;
        const isClient = req.user.role === 'customer';
        if (!projectId || !spaceId) {
            return fail(res, new Error("Project ID and Space ID are required"), 400);
        }

        const discussionQuery = {
            projectId,
            spaceId,                          // FIX 1: was missing, caused cross-space inflation
            retailerId: null,                 // FIX 2: was missing, included retailer chats
            readBy: { $ne: userId },
            referencedMaterialId: { $ne: null }
        };
        if (isClient) discussionQuery.isInternal = { $ne: true };

        const discussions = await Discussion.find(discussionQuery).lean();

        // 2. Get pending approvals grouped by materialId (already correctly scoped to spaceId)
        const approvals = await MaterialHistory.find({
            projectId,
            spaceId,
            approvalStatus: 'Pending',
            readBy: { $ne: userId }
        }).lean();

        // 3. Count general space discussions (not tied to a specific material or retailer)
        // BUG FIX 3: Added `spaceId` so count is scoped to this space, not the whole project
        const generalDiscussionQuery = {
            projectId,
            spaceId,                          // FIX 3: was missing, caused project-wide count
            readBy: { $ne: userId },
            referencedMaterialId: null,
            retailerId: null
        };
        if (isClient) generalDiscussionQuery.isInternal = { $ne: true };
        const generalDiscussionsCount = await Discussion.countDocuments(generalDiscussionQuery);

        // 4. Aggregate counts by material ID
        const notificationsMap = {};

        discussions.forEach(d => {
            const matId = String(d.referencedMaterialId);
            if (!notificationsMap[matId]) {
                notificationsMap[matId] = { unreadMessages: 0, pendingApprovals: 0 };
            }
            notificationsMap[matId].unreadMessages += 1;
        });

        approvals.forEach(a => {
            const matId = String(a.materialId);
            if (!notificationsMap[matId]) {
                notificationsMap[matId] = { unreadMessages: 0, pendingApprovals: 0 };
            }
            notificationsMap[matId].pendingApprovals += 1;
        });

        return success(res, {
            productNotifications: notificationsMap,
            generalDiscussions: generalDiscussionsCount
        }, 200);

    } catch (err) {
        console.error("getProductNotifications error:", err);
        return fail(res, err, 500);
    }
};

export default getProductNotifications;