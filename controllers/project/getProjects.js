import Project from "../../models/project.js";
import Moodboard from "../../models/moodboard.js";
import Discussion from "../../models/discussion.js";
import MaterialHistory from "../../models/materialHistory.js";
import mongoose from "mongoose";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Reusable helper to build unread counts for a single project
 */
const getUnreadCounts = async (projectId, userId, isAdmin, isArchitect) => {
    const discQuery = { projectId, readBy: { $ne: userId } };
    if (!isAdmin && !isArchitect) discQuery.isInternal = { $ne: true };

    let unreadMessagesCount = 0;
    let unreadRetailerMessagesCount = 0;

    if (isArchitect) {
        unreadMessagesCount = await Discussion.countDocuments({ ...discQuery, retailerId: null });
        unreadRetailerMessagesCount = await Discussion.countDocuments({ ...discQuery, retailerId: { $ne: null } });
    } else if (isAdmin) {
        unreadMessagesCount = await Discussion.countDocuments({ ...discQuery, retailerId: null });
        unreadRetailerMessagesCount = await Discussion.countDocuments({ ...discQuery, retailerId: { $ne: null } });
    } else {
        discQuery.retailerId = null;
        unreadMessagesCount = await Discussion.countDocuments(discQuery);
    }

    const pendingApprovalsCount = await MaterialHistory.countDocuments({
        projectId,
        approvalStatus: 'Pending',
        readBy: { $ne: userId }
    });

    return { unreadMessagesCount, unreadRetailerMessagesCount, pendingApprovalsCount };
};

/**
 * Helper to get moodboards with their unread counts
 */
const getMoodboardsWithCounts = async (projectId, userId, isClient) => {
    const moodboards = await Moodboard.find({ projectId })
        .populate({
            path: "estimatedCostId",
            populate: {
                path: "productIds",
                model: "RetailerProduct",
                populate: {
                    path: "productId",
                    model: "Product"
                }
            }
        })
        .sort({ createdAt: -1 })
        .lean();

    return await Promise.all(moodboards.map(async (mb) => {
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
};

const getProjects = async (req, res) => {
    try {
        const { id } = req.params;
        const rawUserId = req.user.id || req.user._id;
        const userId = mongoose.isValidObjectId(rawUserId)
            ? new mongoose.Types.ObjectId(rawUserId)
            : rawUserId;
        const role = req.user.role;
        const isAdmin = role === 'admin';
        const isArchitect = role === 'architect';
        const isClient = role === 'customer';

        let query = {};
        if (id) query._id = id;

        if (isAdmin) {
            const { architectId } = req.query;
            if (architectId) query.architectId = architectId;
        } else if (isArchitect) {
            query.architectId = userId;
        } else {
            query['clients.userId'] = userId;
        }

        if (id) {
            let project = await Project.findOne(query).lean();
            if (!project) {
                return fail(res, new Error("Project not found or access denied"), 404);
            }

            const { unreadMessagesCount, unreadRetailerMessagesCount, pendingApprovalsCount }
                = await getUnreadCounts(project._id, userId, isAdmin, isArchitect);

            if (!isAdmin && !isArchitect && project.privacyControls && !project.privacyControls.showPriceToClient) {
                if (project.estimatedCostId) project.estimatedCostId = null;
            }

            // OPTIONAL CONSOLIDATION: Include moodboards if requested
            let moodboards = [];
            if (req.query.includeSpaces === 'true') {
                moodboards = await getMoodboardsWithCounts(project._id, userId, isClient);
            }

            return success(res, {
                ...project,
                unreadMessages: unreadMessagesCount,
                unreadRetailerMessages: unreadRetailerMessagesCount,
                pendingApprovals: pendingApprovalsCount,
                moodboards: moodboards // Attached moodboards list
            }, 200);
        }

        let projects = await Project.find(query).sort({ createdAt: -1 }).lean();
        if (projects.length === 0) return success(res, [], 200);

        const projectIds = projects.map(p => p._id);

        // BULK FETCH 1: Discussion counts
        const discMatch = { projectId: { $in: projectIds }, readBy: { $ne: userId } };
        if (!isAdmin && !isArchitect) discMatch.isInternal = { $ne: true };

        const discAgg = await Discussion.aggregate([
            { $match: discMatch },
            {
                $group: {
                    _id: "$projectId",
                    totalUnread: {
                        $sum: { $cond: [{ $eq: ["$retailerId", null] }, 1, 0] }
                    },
                    totalRetailerUnread: {
                        $sum: { $cond: [{ $ne: ["$retailerId", null] }, 1, 0] }
                    }
                }
            }
        ]);

        // BULK FETCH 2: MaterialHistory counts
        const historyAgg = await MaterialHistory.aggregate([
            {
                $match: {
                    projectId: { $in: projectIds },
                    approvalStatus: 'Pending',
                    readBy: { $ne: userId }
                }
            },
            {
                $group: {
                    _id: "$projectId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create fast-lookup maps
        const discMap = discAgg.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr;
            return acc;
        }, {});
        const historyMap = historyAgg.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        const projectsWithCounts = projects.map((p) => {
            const pid = p._id.toString();
            const dData = discMap[pid] || { totalUnread: 0, totalRetailerUnread: 0 };

            if (!isAdmin && !isArchitect && p.privacyControls && !p.privacyControls.showPriceToClient) {
                if (p.estimatedCostId) p.estimatedCostId = null;
            }

            return {
                ...p,
                unreadMessages: dData.totalUnread,
                unreadRetailerMessages: dData.totalRetailerUnread,
                pendingApprovals: historyMap[pid] || 0
            };
        });

        return success(res, projectsWithCounts, 200);
    } catch (err) {
        console.error("getProjects error:", err);
        return fail(res, err, 500);
    }
};

export default getProjects;
