import Moodboard from "../../models/moodboard.js";
import Project from "../../models/project.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { s3Upload } from "../../utils/s3upload.js";
import { sanitizeAndUpload } from "../../utils/moodboardSanitizer.js";

const updatemoodboard = async (req, res) => {
    try {
        const { id } = req.params;
        const { moodboard_name, estimatedCostId, canvasState, totalBudget, phase, coverImage, customPhotos, customRows, productMetadata } = req.body;
        const userId = req.user.id;



        const updateData = {};
        if (moodboard_name !== undefined) {
            // Normalize moodboard_name: trim and collapse spaces
            updateData.moodboard_name = moodboard_name.trim().replace(/\s+/g, ' ');
        }
        if (estimatedCostId !== undefined) updateData.estimatedCostId = estimatedCostId;
        if (canvasState !== undefined) {
            const sanitized = await sanitizeAndUpload(canvasState, userId);
            updateData.canvasState = sanitized;

        }
        if (totalBudget !== undefined) updateData.totalBudget = totalBudget;
        if (customPhotos !== undefined) updateData.customPhotos = await sanitizeAndUpload(customPhotos, userId);
        if (customRows !== undefined) updateData.customRows = customRows;
        if (productMetadata !== undefined) updateData.productMetadata = productMetadata;

        // Ensure coverImage is a string if it comes from body (URL selection)
        if (typeof coverImage === 'string' && coverImage.trim() !== '') {
            updateData.coverImage = coverImage;
        }

        // Handle File Upload for coverImage
        if (req.files && (req.files.coverImage || req.files.file)) {
            const files = req.files.coverImage || req.files.file;
            const uploadResults = await s3Upload(userId, files, 'moodboards/covers');
            if (uploadResults && uploadResults.length > 0) {
                updateData.coverImage = uploadResults[0].secure_url;
            }
        }

        // Fetch moodboard with project for authorization check
        const moodboard = await Moodboard.findById(id).populate('projectId');
        if (!moodboard) {
            return fail(res, new Error("Moodboard not found"), 404);
        }

        const project = moodboard.projectId;
        const userEmail = req.user.email;
        const isAdmin = req.user.role === 'admin';

        const isProjectArchitect = project && project.architectId && project.architectId.toString() === userId.toString();
        const isInvitedClient = project && project.clients && project.clients.some(client =>
            (client.userId && client.userId.toString() === userId.toString() && client.status === 'Accepted') ||
            (client.email && client.email.toLowerCase() === userEmail?.toLowerCase() && client.status === 'Accepted')
        );
        const isCreator = moodboard.userId && moodboard.userId.toString() === userId.toString();

        if (!isAdmin && !isProjectArchitect && !isInvitedClient && !isCreator) {
            return fail(res, new Error("Not authorized to update this moodboard"), 403);
        }

        const updatedMoodboard = await Moodboard.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // Sync with Project
        if (totalBudget !== undefined || phase !== undefined) {
            const projectUpdate = {};
            if (totalBudget !== undefined) projectUpdate.budget = String(totalBudget);
            if (phase !== undefined) projectUpdate.phase = phase;

            await Project.findByIdAndUpdate(updatedMoodboard.projectId, projectUpdate);
        }


        return success(res, updatedMoodboard, 200);
    } catch (err) {
        console.error("updatemoodboard error:", err);
        return fail(res, err, 500);
    }
};

export default updatemoodboard;
