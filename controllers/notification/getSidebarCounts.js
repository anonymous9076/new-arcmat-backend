import Project from "../../models/project.js";
import Discussion from "../../models/discussion.js";
import RetailerRequest from "../../models/retailerRequest.js";
import Product from "../../models/product.js";
import mongoose from "mongoose";
import { success, fail } from "../../middlewares/responseHandler.js";

export const getSidebarCounts = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id || req.user._id);
        const role = req.user.role;
        const isAdmin = role === 'admin';
        const isArchitect = role === 'architect';
        const isRetailer = role === 'retailer';

        let counts = {
            totalUnread: 0,
            totalRetailerUnread: 0
        };

        // 1. Get Project Context
        let projectQuery = {};
        if (isArchitect) {
            projectQuery.architectId = userId;
        } else if (!isAdmin) {
            // Clients/customers see only their assigned projects
            projectQuery['clients.userId'] = userId;
        }
        // Admins: no filter — they see all projects
        const projects = await Project.find(projectQuery).select('_id').lean();
        const projectIds = projects.map(p => p._id);

        // 2. Count "Total Unread" (General Messages - non-retailer)
        if (projectIds.length > 0) {
            const discQuery = {
                projectId: { $in: projectIds },
                readBy: { $ne: userId },
                retailerId: null
            };
            if (!isAdmin && !isArchitect) discQuery.isInternal = { $ne: true };
            counts.totalUnread = await Discussion.countDocuments(discQuery);
        }

        // 3. Count "Total Retailer Unread"
        if (isArchitect) {
            // Architect sees: 
            // A) Retailer messages in their projects
            // B) Messages in their initiated RetailerRequests (standalone)
            const requests = await RetailerRequest.find({ professionalId: userId }).select('materialId').lean();
            const materialIds = requests.map(r => r.materialId).filter(id => id && mongoose.isValidObjectId(id));

            counts.totalRetailerUnread = await Discussion.countDocuments({
                readBy: { $ne: userId },
                retailerId: { $ne: null },
                isInternal: true,
                $or: [
                    { projectId: { $in: projectIds } },
                    { referencedMaterialId: { $in: materialIds } }
                ]
            });
        } else if (isRetailer) {
            // Retailer sees: Anything where they are the retailer collaborator
            counts.totalRetailerUnread = await Discussion.countDocuments({
                retailerId: userId,
                readBy: { $ne: userId },
                isInternal: true
            });
        } else if (isAdmin) {
            // Admin sees all retailer messages they haven't read
            counts.totalRetailerUnread = await Discussion.countDocuments({
                retailerId: { $ne: null },
                readBy: { $ne: userId },
                isInternal: true
            });
        }

        return success(res, counts, 200);
    } catch (err) {
        console.error("getSidebarCounts error:", err);
        return fail(res, err, 500);
    }
};
