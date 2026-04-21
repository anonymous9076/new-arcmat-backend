import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import RetailerProduct from "../../models/retailerproduct.js";
import Product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import Discussion from "../../models/discussion.js";
import MaterialHistory from "../../models/materialHistory.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getmoodboardbyid = async (req, res) => {
    try {
        const { id } = req.params;
        const authUserId = req.user.id;
        const isAdmin = req.user.role === 'admin';
        const isClient = req.user.role === 'customer' || req.user.role === 'professional';

        const moodboard = await Moodboard.findById(id)
            .populate("projectId")
            .populate({
                path: "estimatedCostId",
                populate: {
                    path: "productIds",
                    model: "RetailerProduct",
                    populate: [
                        {
                            path: 'productId',
                            model: 'Product',
                            populate: { path: 'brand categoryId subcategoryId' }
                        },
                        {
                            path: 'variantId',
                            model: 'variant'
                        }
                    ]
                }
            })
            .lean();

        if (!moodboard) {
            return fail(res, new Error("Moodboard not found"), 404);
        }

        if (moodboard.estimatedCostId) {
            moodboard.estimatedCostId.productIds = (moodboard.estimatedCostId.productIds || []).filter(p => p !== null);
            moodboard.estimatedCostId.products = moodboard.estimatedCostId.productIds;
        }

        const project = moodboard.projectId;
        const userEmail = req.user.email;

        const isProjectArchitect = project && project.architectId && project.architectId.toString() === authUserId.toString();
        const isInvitedClient = project && project.clients && project.clients.some(client =>
            (client.userId && client.userId.toString() === authUserId.toString() && client.status === 'Accepted') ||
            (client.email && client.email.toLowerCase() === userEmail?.toLowerCase() && client.status === 'Accepted')
        );
        const isCreator = moodboard.userId && moodboard.userId.toString() === authUserId.toString();

        if (!isAdmin && !isProjectArchitect && !isInvitedClient && !isCreator) {
            return fail(res, new Error("Not authorized to view this moodboard"), 403);
        }

        // OPTIONAL CONSOLIDATION 1: Sibling spaces
        let siblings = [];
        if (req.query.includeSiblings === 'true' && project) {
            siblings = await Moodboard.find({ projectId: project._id }, '_id moodboard_name').lean();
        }

        // OPTIONAL CONSOLIDATION 2: unread counts / notifications
        let notifications = null;
        if (req.query.includeNotifications === 'true' && project) {
            const projectId = project._id;
            const spaceId = moodboard._id;

            const discussionQuery = { projectId, spaceId, retailerId: null, readBy: { $ne: authUserId }, referencedMaterialId: { $ne: null } };
            if (isClient) discussionQuery.isInternal = { $ne: true };
            const discussions = await Discussion.find(discussionQuery).lean();

            const approvals = await MaterialHistory.find({ projectId, spaceId, approvalStatus: 'Pending', readBy: { $ne: authUserId } }).lean();

            const generalDiscussionQuery = { projectId, spaceId, readBy: { $ne: authUserId }, referencedMaterialId: null, retailerId: null };
            if (isClient) generalDiscussionQuery.isInternal = { $ne: true };
            const generalDiscussionsCount = await Discussion.countDocuments(generalDiscussionQuery);

            const notificationsMap = {};
            discussions.forEach(d => {
                const matId = String(d.referencedMaterialId);
                if (!notificationsMap[matId]) notificationsMap[matId] = { unreadMessages: 0, pendingApprovals: 0 };
                notificationsMap[matId].unreadMessages += 1;
            });
            approvals.forEach(a => {
                const matId = String(a.materialId);
                if (!notificationsMap[matId]) notificationsMap[matId] = { unreadMessages: 0, pendingApprovals: 0 };
                notificationsMap[matId].pendingApprovals += 1;
            });

            notifications = { productNotifications: notificationsMap, generalDiscussions: generalDiscussionsCount };
        }

        return success(res, {
            ...moodboard,
            siblings: siblings,
            notifications: notifications
        }, 200);
    } catch (err) {
        console.error("getmoodboardbyid error:", err);
        return fail(res, err, 500);
    }
};

export default getmoodboardbyid;
