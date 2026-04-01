import mongoose from 'mongoose';
import RetailerRequest from "../../models/retailerRequest.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Architect creates a retailer contact request
 */
export const createRetailerRequest = async (req, res) => {
    try {
        let { projectId } = req.params;
        if (!projectId || projectId === 'undefined' || projectId === 'null') {
            projectId = null;
        }
        const { materialId, materialName, city, notes, retailerId } = req.body;
        const professionalId = req.user.id;

        const request = new RetailerRequest({
            projectId,
            professionalId,
            materialId: materialId || null,
            materialName: materialName || null,
            retailerId: retailerId || null,
            city,
            notes,
        });

        await request.save();

        // Send notifications
        try {
            const Notification = (await import('../../models/notification.js')).default;
            const Project = (await import('../../models/project.js')).default;

            let projectName = "General Inquiry";
            if (projectId) {
                const project = await Project.findById(projectId).select('projectName').lean();
                if (project) projectName = project.projectName;
            }

            // 1. Notify Admin
            await new Notification({
                sender: professionalId,
                recipientType: 'role',
                recipientRole: 'admin',
                type: 'SYSTEM_ANNOUNCEMENT',
                message: `New Retailer Contact Request from an architect for ${materialName || 'a material'} in project: ${projectName}`,
                relatedData: {
                    projectId,
                    productId: materialId,
                    requestId: request._id
                }
            }).save();

            // 2. Notify specific retailer if assigned
            if (retailerId) {
                await new Notification({
                    sender: professionalId,
                    recipient: retailerId,
                    type: 'RETAILER_CONTACT_REQUEST',
                    message: `An architect wants to contact you regarding ${materialName || 'a material'} for project: ${projectName}`,
                    relatedData: {
                        projectId,
                        productId: materialId,
                        requestId: request._id
                    }
                }).save();
            }
        } catch (notifErr) {
            console.error("Failed to send RetailerRequest notification:", notifErr);
        }

        return success(res, {
            message: "Retailer contact request created. Arcmat will notify you shortly.",
            request,
        }, 201);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Get all retailer requests for the authenticated architect
 */
export const getMyRetailerRequests = async (req, res) => {
    try {
        const professionalId = req.user.id;

        const requests = await RetailerRequest.find({ professionalId })
            .sort({ createdAt: -1 })
            .populate('projectId', 'projectName')
            .populate('retailerId', 'name email mobile');

        const Discussion = (await import('../../models/discussion.js')).default;

        // Robust manual resolution for material info and unread counts
        const enhancedRequests = await Promise.all(requests.map(async (req) => {
            const r = req.toObject();

            // Unread count: query by retailerId + materialId only — no projectId dependency.
            // This is the source of truth and works for both project-linked and standalone chats.
            if (r.retailerId) {
                const retailerIdValue = r.retailerId._id || r.retailerId;
                r.unreadMessages = await Discussion.countDocuments({
                    retailerId: retailerIdValue,
                    referencedMaterialId: r.materialId,
                    readBy: { $ne: professionalId },
                    isInternal: true
                });
            }

            if (req.materialId && mongoose.isValidObjectId(req.materialId)) {
                try {
                    // Try Product first
                    let material = await mongoose.model('Product').findById(req.materialId).select('product_images product_name product_image').lean();
                    if (!material) {
                        // Try RetailerProduct
                        const rp = await mongoose.model('RetailerProduct').findById(req.materialId)
                            .populate('productId', 'product_images product_name product_image')
                            .lean();
                        material = rp?.productId;
                    }
                    if (material) r.materialId = material;
                } catch (e) {
                    console.log('Manual material resolve fail in getMyRetailerRequests:', e.message);
                }
            }
            return r;
        }));

        return success(res, enhancedRequests, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Get all retailer requests in a project
 */
export const getProjectRetailerRequests = async (req, res) => {
    try {
        let { projectId } = req.params;
        if (!projectId || projectId === 'undefined' || projectId === 'null') {
            projectId = null;
        }

        const requests = await RetailerRequest.find({ projectId })
            .sort({ createdAt: -1 })
            .populate('professionalId', 'name email')
            .populate('retailerId', 'name email mobile');

        return success(res, requests, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Admin/Arcmat updates retailer request — confirms and shares retailer details
 */
export const updateRetailerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, retailerDetails } = req.body;

        const validStatuses = ['Pending', 'Processing', 'Confirmed', 'Closed'];
        if (status && !validStatuses.includes(status)) {
            return fail(res, new Error("Invalid status"), 400);
        }

        const update = {};
        if (status) update.status = status;
        if (retailerDetails) update.retailerDetails = retailerDetails;
        if (status === 'Confirmed') update.confirmedAt = new Date();

        const request = await RetailerRequest.findByIdAndUpdate(requestId, update, { new: true });

        if (!request) {
            return fail(res, new Error("Request not found"), 404);
        }

        return success(res, { message: "Retailer request updated", request }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Admin: get all retailer requests (across all architects)
 */
export const getAllRetailerRequests = async (req, res) => {
    try {
        const requests = await RetailerRequest.find()
            .sort({ createdAt: -1 })
            .populate('professionalId', 'name email')
            .populate('projectId', 'projectName');

        return success(res, requests, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

import Product from "../../models/product.js";

/**
 * Retailer: get requests assigned to them + unassigned leads for their brands
 */
export const getRetailerAssignedRequests = async (req, res) => {
    try {
        const retailerId = req.user.id;
        const Usertable = (await import('../../models/user.js')).default;

        // 1. Get retailer's authorized brands
        const retailer = await Usertable.findById(retailerId).select('selectedBrands').lean();
        const authorizedBrandIds = retailer?.selectedBrands || [];

        // 2. Find ALL base products belonging to these brands
        const authorizedProducts = await Product.find({
            brand: { $in: authorizedBrandIds }
        }).select('_id').lean();
        const authorizedProductIds = authorizedProducts.map(p => p._id);

        // 3. Also find RetailerProducts that point to these authorized products
        const RetailerProduct = (await import('../../models/retailerproduct.js')).default;
        const authorizedRetailerProducts = await RetailerProduct.find({
            productId: { $in: authorizedProductIds }
        }).select('_id').lean();
        const authorizedRetailerProductIds = authorizedRetailerProducts.map(rp => rp._id);

        // Combine all possible IDs that this retailer can fulfill
        const allFulfillableIds = [...authorizedProductIds, ...authorizedRetailerProductIds];

        // 4. Find requests: explicitly assigned OR unassigned leads for their brands
        const requests = await RetailerRequest.find({
            $or: [
                { retailerId: retailerId },
                {
                    retailerId: null,
                    materialId: { $in: allFulfillableIds }
                }
            ]
        })
            .sort({ createdAt: -1 })
            .populate('professionalId', 'name email mobile')
            .populate('projectId', 'projectName');

        const Discussion = (await import('../../models/discussion.js')).default;

        // 5. Enhance requests with material images and unread message counts
        const enhancedRequests = await Promise.all(requests.map(async (req) => {
            const r = req.toObject();

            // Unread count: query by retailerId + materialId only — no projectId dependency.
            r.unreadMessages = await Discussion.countDocuments({
                retailerId: new mongoose.Types.ObjectId(retailerId),
                referencedMaterialId: r.materialId,
                readBy: { $ne: retailerId },
                isInternal: true
            });

            if (req.materialId && mongoose.isValidObjectId(req.materialId)) {
                // Try manual resolution for material info
                try {
                    // Try Product first
                    let material = await mongoose.model('Product').findById(req.materialId).select('product_images product_name product_image').lean();
                    if (!material) {
                        // Try RetailerProduct
                        const rp = await mongoose.model('RetailerProduct').findById(req.materialId)
                            .populate('productId', 'product_images product_name product_image')
                            .lean();
                        material = rp?.productId;
                    }
                    if (material) r.materialId = material;
                } catch (e) {
                    console.log('Manual material resolve fail:', e.message);
                }
            }
            return r;
        }));

        return success(res, enhancedRequests, 200);
    } catch (err) {
        console.error('getRetailerAssignedRequests error:', err);
        return fail(res, err, 500);
    }
};

/**
 * Retailer updates request status
 */
export const retailerUpdateStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const retailerId = req.user.id;

        const validStatuses = ['Pending', 'Processing', 'Confirmed', 'Closed'];
        if (!validStatuses.includes(status)) {
            return fail(res, new Error("Invalid status"), 400);
        }

        // Verify that the request is either assigned to this retailer OR is an open lead for their brands
        const request = await RetailerRequest.findById(requestId);
        if (!request) return fail(res, new Error("Request not found"), 404);

        // If it was an open lead, assign it to this retailer upon update
        if (!request.retailerId) {
            request.retailerId = retailerId;
        } else if (request.retailerId.toString() !== retailerId) {
            return fail(res, new Error("Unauthorized: Request assigned to another retailer"), 403);
        }

        request.status = status;
        if (status === 'Confirmed' && !request.confirmedAt) {
            request.confirmedAt = new Date();
        }

        await request.save();

        // Notify Architect about status update
        try {
            const Notification = (await import("../../models/notification.js")).default;
            const Project = (await import("../../models/project.js")).default;
            const project = await Project.findById(request.projectId).lean();

            if (project) {
                await new Notification({
                    sender: retailerId,
                    recipient: project.architectId,
                    type: 'REQUEST_STATUS_UPDATE',
                    message: `Retailer updated status to "${status}" for material ${request.materialName} in project ${project.projectName}`,
                    relatedData: {
                        projectId: project._id,
                        productId: request.materialId && mongoose.isValidObjectId(request.materialId) ? request.materialId : null
                    }
                }).save();
            }
        } catch (notifyErr) {
            console.error("Failed to send notification for status update:", notifyErr);
        }

        return success(res, { message: "Request status updated", request }, 200);
    } catch (err) {
        console.error('retailerUpdateStatus error:', err);
        return fail(res, err, 500);
    }
};
