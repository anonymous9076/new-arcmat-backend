import Project from "../../models/project.js";
import Moodboard from "../../models/moodboard.js";
import EstimatedCost from "../../models/estimatedCost.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Mark a project as completed and finalize all materials
 */
export const completeProject = async (req, res) => {
    try {
        const { id } = req.params;
        const architectId = req.user.id;

        // 1. Find the project and ensure it belongs to this architect
        const project = await Project.findOne({ _id: id, architectId });

        if (!project) {
            return fail(res, new Error("Project not found or access denied"), 404);
        }

        // 2. Update Project Phase and Status
        project.phase = 'Completed';
        project.status = 'Completed';
        await project.save();

        // 3. Find all moodboards for this project
        const moodboards = await Moodboard.find({ projectId: id });

        // 4. Update all materials across all moodboards to "Specified"
        for (const board of moodboards) {
            let hasChanges = false;

            // Mark custom photos as Specified
            if (board.customPhotos && Array.isArray(board.customPhotos)) {
                board.customPhotos = board.customPhotos.map(photo => ({
                    ...photo,
                    status: 'Specified'
                }));
                hasChanges = true;
            }

            // Mark custom rows as Specified
            if (board.customRows && Array.isArray(board.customRows)) {
                board.customRows = board.customRows.map(row => ({
                    ...row,
                    status: 'Specified'
                }));
                hasChanges = true;
            }

            // Mark Catalog Products as Specified
            if (board.estimatedCostId) {
                const estimatedCost = await EstimatedCost.findById(board.estimatedCostId);
                if (estimatedCost && estimatedCost.productIds) {
                    const productMetadata = { ...(board.productMetadata || {}) };

                    estimatedCost.productIds.forEach(productId => {
                        const pid = productId.toString();
                        if (typeof productMetadata[pid] === 'object') {
                            productMetadata[pid].status = 'Specified';
                        } else {
                            productMetadata[pid] = { status: 'Specified' };
                        }
                    });

                    board.productMetadata = productMetadata;
                    hasChanges = true;
                }
            }

            if (hasChanges) {
                // Inform Mongoose that Mixed / Array types have changed if needed
                board.markModified('customPhotos');
                board.markModified('customRows');
                board.markModified('productMetadata');
                await board.save();
            }
        }

        return success(res, { message: "Project completed successfully", project }, 200);
    } catch (err) {
        console.error("completeProject error:", err);
        return fail(res, err, 500);
    }
};
