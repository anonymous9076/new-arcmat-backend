import Discussion from "../../models/discussion.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload } from "../../utils/s3upload.js";
import mongoose from 'mongoose';

/**
 * Post a comment / message in a project discussion
 */
export const postComment = async (req, res) => {
    try {
        const { projectId: rawProjectId } = req.params;
        const projectId = mongoose.Types.ObjectId.isValid(rawProjectId) ? rawProjectId : null;

        const { message, referencedMaterialId, referencedMaterialName, referencedMaterialImage, type, materialHistoryId, spaceId, retailerId } = req.body;
        const authorId = req.user.id;

        let uploadedAttachments = [];
        if (req.files && req.files.length > 0) {
            try {
                const folder = `discussions/${projectId}`;
                const uploadResults = await s3Upload(authorId, req.files, folder);
                uploadedAttachments = uploadResults.map(result => result.secure_url);
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
            readBy: [authorId], // Mark as read by the person who created it
        });

        await comment.save();
        await comment.populate('authorId', 'name email role profile');

        try {
            const Notification = (await import("../../models/notification.js")).default;
            const Project = (await import("../../models/project.js")).default;
            const RetailerRequest = (await import("../../models/retailerRequest.js")).default;

            let recipient = null;
            let notificationMessage = "";

            if (req.user.role === 'retailer') {
                // Retailer sends message → notify architect/professional
                // Try to find the architect from the project first
                if (projectId) {
                    const project = await Project.findById(projectId).select('architectId projectName').lean();
                    if (project) {
                        recipient = project.architectId;
                        notificationMessage = `New message from retailer regarding project ${project.projectName}`;
                    }
                }

                // Fallback: search RetailerRequest for professionalId
                if (!recipient && (retailerId || authorId) && referencedMaterialId) {
                    const rr = await RetailerRequest.findOne({
                        retailerId: retailerId || authorId,
                        materialId: referencedMaterialId
                    }).lean();
                    recipient = rr?.professionalId;
                    if (!notificationMessage) notificationMessage = `New message from retailer regarding ${referencedMaterialName || 'a material'}`;
                }
            } else if (req.user.role === 'architect' || req.user.role === 'admin') {
                // Architect/Admin sends message → notify retailer
                if (retailerId) {
                    recipient = retailerId;
                } else {
                    // Search for the retailer assigned to this request
                    const query = { materialId: referencedMaterialId };
                    if (projectId) query.projectId = projectId;
                    else query.retailerId = { $ne: null }; // If no project, we need a retailer-assigned request

                    const rr = await RetailerRequest.findOne(query).lean();
                    recipient = rr?.retailerId;
                }

                let projectNameStr = "a project";
                if (projectId) {
                    const project = await Project.findById(projectId).select('projectName').lean();
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
                            ? referencedMaterialId : null
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

        // Handle invalid or "null" projectId
        if (mongoose.Types.ObjectId.isValid(rawProjectId)) {
            query.projectId = rawProjectId;
        } else {
            // If project context is missing, we MUST have at least retailerId and materialId
            // to provide a reliable context for the conversation.
            if (!retailerId || !materialId) {
                return success(res, [], 200);
            }
            query.retailerId = retailerId;
            query.referencedMaterialId = materialId;
            query.projectId = null; // Look for explicitly project-less chats
        }

        if (spaceId) query.spaceId = spaceId;

        if (isInternal === 'true') {
            query.isInternal = true;
        } else if (isInternal === 'false') {
            query.isInternal = { $ne: true };
        }

        // BUG FIX 3: Check explicit `retailerId` query param FIRST before
        // falling into role-based defaults, preventing the retailer-role
        // branch from overwriting a deliberately passed retailerId
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
        // BUG FIX 4: Added `admin` to privileged roles allowed to delete any comment
        const isPrivileged = role === 'architect' || role === 'admin';

        if (!isAuthor && !isPrivileged) {
            return fail(res, new Error("Unauthorized"), 403);
        }

        await comment.deleteOne();
        return success(res, { message: "Comment deleted" }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};