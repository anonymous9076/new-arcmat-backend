import Discussion from "../../models/discussion.js";
import Project from "../../models/project.js";
import RetailerRequest from "../../models/retailerRequest.js";
import SampleRequest from "../../models/sampleRequest.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload } from "../../utils/s3upload.js";
import mongoose from 'mongoose';

const isSameId = (left, right) => Boolean(left && right && left.toString() === right.toString());

const isAcceptedClient = (project, user) => Boolean(
    project?.clients?.some((client) =>
        client.status === 'Accepted' && (
            (client.userId && isSameId(client.userId, user.id)) ||
            (client.email && client.email.toLowerCase() === user.email?.toLowerCase())
        )
    )
);

const hasDirectRetailerThreadAccess = async ({ projectId = null, retailerId, materialId, user }) => {
    if (!retailerId || !materialId) {
        return false;
    }

    if (user.role === 'customer') {
        return false;
    }

    if (user.role === 'retailer' && retailerId.toString() !== user.id.toString()) {
        return false;
    }

    const retailerRequestQuery = {
        materialId,
        projectId: projectId || null,
    };
    const sampleRequestQuery = {
        productId: materialId,
        projectId: projectId || null,
    };

    if (user.role === 'architect') {
        retailerRequestQuery.professionalId = user.id;
        retailerRequestQuery.retailerId = retailerId;
        sampleRequestQuery.professionalId = user.id;
        sampleRequestQuery.retailerId = retailerId;
    } else if (user.role === 'retailer') {
        retailerRequestQuery.retailerId = user.id;
        sampleRequestQuery.retailerId = user.id;
    } else if (user.role === 'admin') {
        retailerRequestQuery.retailerId = retailerId;
        sampleRequestQuery.retailerId = retailerId;
    }

    const [retailerRequest, sampleRequest] = await Promise.all([
        RetailerRequest.findOne(retailerRequestQuery).lean(),
        SampleRequest.findOne(sampleRequestQuery).lean(),
    ]);

    return Boolean(retailerRequest || sampleRequest);
};

const validateDiscussionAccess = async ({ projectId, retailerId, materialId, user, requireDirectContext = false }) => {
    if (!projectId) {
        if (!retailerId || !materialId) {
            return {
                allowed: false,
                statusCode: requireDirectContext ? 400 : 403,
                message: requireDirectContext
                    ? "Retailer and material context are required for direct discussions"
                    : "Unauthorized",
            };
        }

        const hasAccess = await hasDirectRetailerThreadAccess({
            projectId: null,
            retailerId,
            materialId,
            user,
        });

        return hasAccess
            ? { allowed: true }
            : { allowed: false, statusCode: 403, message: "Unauthorized" };
    }

    const project = await Project.findById(projectId).select("architectId clients retailers projectName").lean();
    if (!project) {
        return { allowed: false, statusCode: 404, message: "Project not found" };
    }

    if (user.role === 'admin') {
        return { allowed: true, project };
    }

    if (user.role === 'architect') {
        return isSameId(project.architectId, user.id)
            ? { allowed: true, project }
            : { allowed: false, statusCode: 403, message: "Unauthorized" };
    }

    if (user.role === 'customer') {
        return isAcceptedClient(project, user)
            ? { allowed: true, project }
            : { allowed: false, statusCode: 403, message: "Unauthorized" };
    }

    if (user.role === 'retailer') {
        const isLinkedRetailer = Array.isArray(project.retailers) && project.retailers.some((retailer) => isSameId(retailer, user.id));
        if (isLinkedRetailer) {
            return { allowed: true, project };
        }

        if (retailerId && materialId) {
            const hasAccess = await hasDirectRetailerThreadAccess({
                projectId,
                retailerId,
                materialId,
                user,
            });

            if (hasAccess) {
                return { allowed: true, project };
            }
        }
    }

    return { allowed: false, statusCode: 403, message: "Unauthorized" };
};

/**
 * Post a comment / message in a project discussion
 */
export const postComment = async (req, res) => {
    try {
        const { projectId: rawProjectId } = req.params;
        const projectId = mongoose.Types.ObjectId.isValid(rawProjectId) ? rawProjectId : null;
        const {
            message,
            referencedMaterialId,
            referencedMaterialName,
            referencedMaterialImage,
            type,
            materialHistoryId,
            spaceId,
            retailerId,
        } = req.body;
        const authorId = req.user.id;

        const access = await validateDiscussionAccess({
            projectId,
            retailerId: retailerId || null,
            materialId: referencedMaterialId || null,
            user: req.user,
            requireDirectContext: !projectId,
        });

        if (!access.allowed) {
            return fail(res, new Error(access.message), access.statusCode);
        }

        let uploadedAttachments = [];
        if (req.files && req.files.length > 0) {
            try {
                const folder = `discussions/${projectId}`;
                const uploadResults = await s3Upload(authorId, req.files, folder);
                uploadedAttachments = uploadResults.map((result) => result.secure_url);
            } catch (uploadErr) {
                console.error("S3 upload failed for discussion:", uploadErr);
                return fail(res, new Error("Failed to upload attachments"), 500);
            }
        }

        if ((!message || !message.trim()) && uploadedAttachments.length === 0) {
            return fail(res, new Error("Message or attachment is required"), 400);
        }

        const comment = new Discussion({
            projectId,
            spaceId: spaceId || null,
            authorId,
            message: message?.trim() || "",
            referencedMaterialId: referencedMaterialId || null,
            referencedMaterialName: referencedMaterialName || null,
            referencedMaterialImage: referencedMaterialImage || null,
            type: type || 'comment',
            materialHistoryId: materialHistoryId || null,
            retailerId: retailerId || null,
            attachments: uploadedAttachments,
            isInternal: (req.user.role === 'architect' || req.user.role === 'admin' || req.user.role === 'retailer')
                ? (req.user.role === 'retailer' ? true : !!req.body.isInternal)
                : false,
            readBy: [authorId],
        });

        await comment.save();
        await comment.populate('authorId', 'name email role profile');

        try {
            const Notification = (await import("../../models/notification.js")).default;

            let recipient = null;
            let notificationMessage = "";

            if (req.user.role === 'retailer') {
                if (projectId) {
                    const project = access.project || await Project.findById(projectId).select('architectId projectName').lean();
                    if (project) {
                        recipient = project.architectId;
                        notificationMessage = `New message from retailer regarding project ${project.projectName}`;
                    }
                }

                if (!recipient && (retailerId || authorId) && referencedMaterialId) {
                    const retailerRequest = await RetailerRequest.findOne({
                        retailerId: retailerId || authorId,
                        materialId: referencedMaterialId
                    }).lean();
                    recipient = retailerRequest?.professionalId;
                    if (!notificationMessage) {
                        notificationMessage = `New message from retailer regarding ${referencedMaterialName || 'a material'}`;
                    }
                }
            } else if (req.user.role === 'architect' || req.user.role === 'admin') {
                if (retailerId) {
                    recipient = retailerId;
                } else {
                    const requestQuery = { materialId: referencedMaterialId };
                    if (projectId) requestQuery.projectId = projectId;
                    else requestQuery.retailerId = { $ne: null };

                    const retailerRequest = await RetailerRequest.findOne(requestQuery).lean();
                    recipient = retailerRequest?.retailerId;
                }

                let projectNameStr = "a project";
                if (projectId) {
                    const project = access.project || await Project.findById(projectId).select('projectName').lean();
                    if (project) projectNameStr = project.projectName;
                }
                notificationMessage = `Architect sent a message for ${projectNameStr}`;
            }

            if (recipient && recipient.toString() !== authorId.toString()) {
                await new Notification({
                    sender: authorId,
                    recipient,
                    type: 'NEW_MESSAGE',
                    message: notificationMessage,
                    relatedData: {
                        projectId,
                        productId: referencedMaterialId && mongoose.isValidObjectId(referencedMaterialId)
                            ? referencedMaterialId
                            : null
                    }
                }).save();
            }
        } catch (notifyErr) {
            console.error("Notification creation failed in postComment:", notifyErr);
        }

        return success(res, comment, 201);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Get all comments for a project
 */
export const getComments = async (req, res) => {
    try {
        const { projectId: rawProjectId } = req.params;
        const { spaceId, retailerId, materialId, isInternal, aggregate } = req.query;
        const isClient = req.user.role === 'customer';

        let query = {};

        if (mongoose.Types.ObjectId.isValid(rawProjectId)) {
            query.projectId = rawProjectId;
        } else {
            if (!retailerId || !materialId) {
                return success(res, [], 200);
            }
            query.retailerId = retailerId;
            query.referencedMaterialId = materialId;
            query.projectId = null;
        }

        const access = await validateDiscussionAccess({
            projectId: query.projectId || null,
            retailerId: retailerId || null,
            materialId: materialId || null,
            user: req.user,
        });

        if (!access.allowed) {
            return fail(res, new Error(access.message), access.statusCode);
        }

        if (spaceId) query.spaceId = spaceId;

        if (isInternal === 'true') {
            query.isInternal = true;
        } else if (isInternal === 'false') {
            query.isInternal = { $ne: true };
        }

        if (retailerId) {
            query.retailerId = retailerId;
            if (materialId) query.referencedMaterialId = materialId;
        } else if (req.user.role === 'retailer') {
            query.retailerId = req.user.id;
            if (materialId) query.referencedMaterialId = materialId;
            query.isInternal = true;
        } else if (materialId) {
            query.referencedMaterialId = materialId;
        } else if (!isClient && !spaceId && aggregate !== 'true') {
            query.retailerId = null;
            query.spaceId = null;
            query.referencedMaterialId = null;
        }

        if (isClient) {
            query.isInternal = { $ne: true };
            query.retailerId = null;
        }

        const comments = await Discussion.find(query)
            .sort({ createdAt: 1 })
            .populate('authorId', 'name email role profile');

        return success(res, comments, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Delete a comment (author, architect, or admin)
 */
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;
        const role = req.user.role;

        const comment = await Discussion.findById(commentId);
        if (!comment) {
            return fail(res, new Error("Comment not found"), 404);
        }

        const isAuthor = comment.authorId.toString() === userId;
        let isPrivileged = role === 'admin';

        if (!isAuthor && role === 'architect') {
            if (comment.projectId) {
                const project = await Project.findById(comment.projectId).select("architectId").lean();
                isPrivileged = isSameId(project?.architectId, userId);
            } else {
                isPrivileged = await hasDirectRetailerThreadAccess({
                    projectId: null,
                    retailerId: comment.retailerId,
                    materialId: comment.referencedMaterialId,
                    user: req.user,
                });
            }
        }

        if (!isAuthor && !isPrivileged) {
            return fail(res, new Error("Unauthorized"), 403);
        }

        await comment.deleteOne();
        return success(res, { message: "Comment deleted" }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};
