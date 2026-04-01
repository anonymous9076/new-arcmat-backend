import SampleRequest from "../../models/sampleRequest.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import Notification from "../../models/notification.js";
import Product from "../../models/product.js";
import Project from "../../models/project.js";
import Usertable from "../../models/user.js";
import RetailerProduct from "../../models/retailerproduct.js";
import mongoose from "mongoose";

/**
 * Professional creates a sample request
 */
export const createSampleRequest = async (req, res) => {
    try {
        let { projectId } = req.params;
        if (!projectId || projectId === 'undefined' || projectId === 'null') {
            projectId = null;
        }
        let { 
            moodboardId, productId, productName, materialId, materialName, 
            shippingAddress: incomingAddress,
            shipping_first_name, shipping_last_name, shipping_address1, shipping_address2, 
            shipping_city, shipping_state, shipping_pincode, shipping_mobile, shipping_email, 
            notes, retailerId 
        } = req.body;
        const professionalId = new mongoose.Types.ObjectId(req.user.id);

        const actualProductId = productId || materialId;
        const actualProductName = productName || materialName;

        if (!actualProductId) {
            return fail(res, new Error("Product ID is required"), 400);
        }

        // Build shipping address from incomingAddress object or flattened fields
        const finalShippingAddress = incomingAddress || {
            name: `${shipping_first_name || ''} ${shipping_last_name || ''}`.trim() || 'No Name',
            phone: shipping_mobile || '',
            address: `${shipping_address1 || ''}${shipping_address2 ? ', ' + shipping_address2 : ''}` || 'No Address',
            city: shipping_city || '',
            pincode: shipping_pincode || '',
        };

        const request = new SampleRequest({
            projectId,
            spaceId: moodboardId || null,
            professionalId,
            productId: actualProductId,
            productName: actualProductName,
            shippingAddress: finalShippingAddress,
            notes,
            retailerId: retailerId || null,
        });

        await request.save();

        // Send notifications
        try {
            let projectName = "General Inquiry";
            if (projectId) {
                const project = await Project.findById(projectId).select('projectName').lean();
                if (project) projectName = project.projectName;
            }

            const product = await Product.findById(actualProductId).select('brand brandName').lean();
            const materialBrand = product?.brand;

            // 1. Send notification to Admins
            await new Notification({
                sender: professionalId,
                recipientType: 'role',
                recipientRole: 'admin',
                type: 'SYSTEM_ANNOUNCEMENT',
                message: `New sample request received for ${actualProductName || 'a product'} from an architect.`,
                relatedData: {
                    productId: actualProductId,
                    projectId: projectId,
                    requestId: request._id
                }
            }).save();
            
            // 2. Send notification to retailer if one is assigned
            if (retailerId) {
                await new Notification({
                    sender: professionalId,
                    recipient: retailerId,
                    type: 'SAMPLE_REQUEST',
                    message: `An architect requested a sample for ${actualProductName || 'a material'} for project: ${projectName}`,
                    relatedData: {
                        projectId,
                        productId: actualProductId,
                        requestId: request._id
                    }
                }).save();
            } else if (materialBrand) {
                // 3. Notify all retailers who deal with this brand
                const relevantRetailers = await Usertable.find({
                    role: 'retailer',
                    selectedBrands: materialBrand
                }).select('_id').lean();

                for (const retailer of relevantRetailers) {
                    await new Notification({
                        sender: professionalId,
                        recipient: retailer._id,
                        type: 'SAMPLE_REQUEST',
                        message: `New sample request lead for ${actualProductName || 'a material'} (Brand: ${product.brandName || 'N/A'}) in project: ${projectName}`,
                        relatedData: {
                            projectId,
                            productId: actualProductId,
                            requestId: request._id
                        }
                    }).save();
                }
            }
        } catch (notifErr) {
            console.error("Failed to send creation notification:", notifErr);
        }

        return success(res, {
            message: "Sample request created",
            request,
        }, 201);
    } catch (err) {
        console.error("createSampleRequest error:", err);
        return fail(res, err, 500);
    }
};

/**
 * Get all sample requests for a project
 */
export const getSampleRequests = async (req, res) => {
    try {
        const { projectId } = req.params;

        const requests = await SampleRequest.find({ projectId })
            .sort({ createdAt: -1 })
            .populate('professionalId', 'name email');

        const mongoose = (await import('mongoose')).default;
        
        // Robust manual resolution for material info
        const enhancedRequests = await Promise.all(requests.map(async (req) => {
            const r = req.toObject();
            if (!r.productId || (typeof r.productId === 'string' || mongoose.Types.ObjectId.isValid(r.productId))) {
                try {
                    // Try Product first
                    let material = await mongoose.model('Product').findById(req.productId).select('product_images product_name product_image').lean();
                    if (!material) {
                        // Try RetailerProduct
                        const rp = await mongoose.model('RetailerProduct').findById(req.productId)
                            .populate('productId', 'product_images product_name product_image')
                            .lean();
                        material = rp?.productId;
                    }
                    if (material) r.productId = material;
                } catch (e) {
                    console.log('Manual material resolve fail in getSampleRequests:', e.message);
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
 * Get all sample requests by a specific professional (across projects)
 */
export const getMySampleRequests = async (req, res) => {
    try {
        const professionalId = req.user.id;
        const mongoose = (await import('mongoose')).default;

        const requests = await SampleRequest.find({ professionalId })
            .sort({ createdAt: -1 })
            .populate('projectId', 'projectName');

        // Robust manual resolution for material info
        const enhancedRequests = await Promise.all(requests.map(async (req) => {
            const r = req.toObject();
            // Check if productId needs manual resolution
            if (!r.productId || (typeof r.productId === 'string' || mongoose.Types.ObjectId.isValid(r.productId))) {
                try {
                    // Try Product first
                    let material = await mongoose.model('Product').findById(req.productId).select('product_images product_name product_image').lean();
                    if (!material) {
                        // Try RetailerProduct
                        const rp = await mongoose.model('RetailerProduct').findById(req.productId)
                            .populate('productId', 'product_images product_name product_image')
                            .lean();
                        material = rp?.productId;
                    }
                    if (material) r.productId = material;
                } catch (e) {
                    console.log('Manual material resolve fail in getMySampleRequests:', e.message);
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
 * Get all sample requests for a specific retailer
 */
export const getRetailerSampleRequests = async (req, res) => {
    try {
        const retailerId = req.user.id;

        // 1. Get retailer's authorized brands
        const retailer = await Usertable.findById(retailerId).select('selectedBrands').lean();
        const authorizedBrandIds = retailer?.selectedBrands || [];

        // 2. Find ALL base products belonging to these brands
        const authorizedProducts = await Product.find({ 
            brand: { $in: authorizedBrandIds } 
        }).select('_id').lean();
        const authorizedProductIds = authorizedProducts.map(p => p._id);

        // 3. Also find RetailerProducts that point to these authorized products
        const authorizedRetailerProducts = await RetailerProduct.find({
            productId: { $in: authorizedProductIds }
        }).select('_id').lean();
        const authorizedRetailerProductIds = authorizedRetailerProducts.map(rp => rp._id);

        // Combine all possible IDs that this retailer can fulfill
        const allFulfillableIds = [...authorizedProductIds, ...authorizedRetailerProductIds];

        // 4. Find requests: explicitly assigned OR unassigned leads for their brands
        const requests = await SampleRequest.find({
            $or: [
                { retailerId: retailerId },
                { 
                    retailerId: null, 
                    productId: { $in: allFulfillableIds } 
                }
            ]
        })
        .sort({ createdAt: -1 })
        .populate('professionalId', 'name email mobile')
        .populate('projectId', 'projectName location');

        const enhancedRequests = await Promise.all(requests.map(async (req) => {
            const r = req.toObject();
            if (r.productId && (typeof r.productId === 'string' || mongoose.Types.ObjectId.isValid(r.productId))) {
                try {
                    // Try Product first
                    let material = await Product.findById(r.productId).select('product_images product_name product_image product_unique_id').lean();
                    if (!material) {
                        // Try RetailerProduct
                        const rp = await RetailerProduct.findById(r.productId)
                            .populate('productId', 'product_images product_name product_image product_unique_id')
                            .lean();
                        material = rp?.productId;
                    }
                    if (material) r.productId = material;
                } catch (e) {
                    console.log('Product resolve fail in getRetailerSampleRequests:', e.message);
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
 * Admin/Retailer updates sample request status
 */
export const updateSampleStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, notes: statusNotes } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const validStatuses = ['Sample Requested', 'Sample Approved', 'Sample Dispatched', 'Sample Delivered'];
        if (!validStatuses.includes(status)) {
            return fail(res, new Error("Invalid status"), 400);
        }

        let request = await SampleRequest.findById(requestId);
        if (!request) {
            return fail(res, new Error("Sample request not found"), 404);
        }

        // Authorization: Admin or the assigned Retailer
        if (userRole === 'retailer') {
            if (!request.retailerId) {
                // Claim the lead if it's currently unassigned
                request.retailerId = userId;
            } else if (request.retailerId.toString() !== userId) {
                return fail(res, new Error("Unauthorized to update this request"), 403);
            }
        }

        const update = { status };
        if (status === 'Sample Dispatched') update.dispatchedAt = new Date();
        if (status === 'Sample Delivered') update.deliveredAt = new Date();
        if (statusNotes) update.notes = statusNotes;

        request = await SampleRequest.findByIdAndUpdate(requestId, update, { new: true });

        // Send notification to architect
        try {
            const Notification = (await import('../../models/notification.js')).default;
            const notification = new Notification({
                sender: userId,
                recipient: request.professionalId,
                type: 'REQUEST_STATUS_UPDATE',
                message: `Your sample request for ${request.productName || 'a product'} has been updated to: ${status}`,
                relatedData: {
                    productId: request.productId,
                    projectId: request.projectId
                }
            });
            await notification.save();
        } catch (notifErr) {
            console.error("Failed to send notification:", notifErr);
        }

        return success(res, { message: "Sample status updated", request }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};
/**
 * Architect deletes their own sample request
 */
export const deleteSampleRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const professionalId = req.user.id;

        const request = await SampleRequest.findOne({ _id: requestId, professionalId });

        if (!request) {
            return fail(res, new Error("Sample request not found or unauthorized"), 404);
        }

        if (request.status !== 'Sample Requested') {
            return fail(res, new Error("Cannot delete request after it has been processed"), 400);
        }

        await SampleRequest.findByIdAndDelete(requestId);

        return success(res, { message: "Sample request deleted" }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Architect updates their own sample request (notes/address)
 */
export const updateSampleRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { shippingAddress, notes } = req.body;
        const professionalId = req.user.id;

        const request = await SampleRequest.findOne({ _id: requestId, professionalId });

        if (!request) {
            return fail(res, new Error("Sample request not found or unauthorized"), 404);
        }

        if (request.status !== 'Sample Requested') {
            return fail(res, new Error("Cannot edit request after it has been processed"), 400);
        }

        const update = {};
        if (shippingAddress) update.shippingAddress = shippingAddress;
        if (notes) update.notes = notes;

        const updatedRequest = await SampleRequest.findByIdAndUpdate(requestId, update, { new: true });

        return success(res, { message: "Sample request updated", updatedRequest }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};
