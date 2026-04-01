import MaterialHistory from "../../models/materialHistory.js";
import Project from "../../models/project.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Add a new material version to a space
 * Called when architect replaces a material in a space.
 */
export const addMaterialVersion = async (req, res) => {
    try {
        const { projectId } = req.params;
        const {
            spaceId,
            spaceName,
            materialId,
            materialName,
            materialImage,
            previousMaterialId,
            previousMaterialName,
            previousMaterialImage,
            reason,
        } = req.body;
        const changedBy = req.user.id;

        // Get the version of the material being replaced
        let newVersion = 1;
        let lastVersion = null;

        if (previousMaterialId) {
            lastVersion = await MaterialHistory.findOne({
                spaceId,
                materialId: previousMaterialId,
                isFinal: true
            }).sort({ version: -1 });

            if (lastVersion) {
                newVersion = lastVersion.version + 1;
            }
        }

        // Fetch current project phase
        const project = await Project.findById(projectId);
        const currentPhase = project?.phase || 'Concept Design';

        // If we are replacing a specific material, mark all previous entries for THAT material as not final and status as Replaced
        if (previousMaterialId) {
            await MaterialHistory.updateMany(
                { spaceId, materialId: previousMaterialId },
                { isFinal: false, status: 'Replaced' }
            );
        }

        const entry = new MaterialHistory({
            projectId,
            spaceId,
            spaceName,
            materialId,
            materialName,
            materialImage,
            previousMaterialId: previousMaterialId || null,
            previousMaterialName: previousMaterialName || (lastVersion?.materialName ?? null),
            previousMaterialImage: previousMaterialImage || (lastVersion?.materialImage ?? null),
            version: newVersion,
            reason,
            changedBy,
            readBy: [changedBy], // Mark as read by the person who created it
            status: 'Pending',
            approvalStatus: 'Pending',
            isFinal: true,
            phase: currentPhase,
        });

        await entry.save();

        return success(res, {
            message: "Material version recorded",
            version: newVersion,
            history: entry
        }, 201);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Get full material history for a space
 */
export const getMaterialHistory = async (req, res) => {
    try {
        const { projectId, spaceId } = req.params;

        const history = await MaterialHistory.find({ projectId, spaceId })
            .sort({ version: 1 })
            .populate('changedBy', 'name email role')
            .populate('approvedBy', 'name email role');

        return success(res, history, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Get all material histories for a project (all spaces)
 */
export const getProjectMaterialHistory = async (req, res) => {
    try {
        const { projectId } = req.params;

        const history = await MaterialHistory.find({ projectId })
            .sort({ spaceId: 1, version: 1 })
            .populate('changedBy', 'name email role')
            .populate('approvedBy', 'name email role');

        return success(res, history, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};

/**
 * Client approves or rejects a specific material version
 */
export const approveMaterialVersion = async (req, res) => {
    try {
        const { versionId } = req.params;
        const { status, comment } = req.body; // 'Approved' or 'Rejected'
        const userId = req.user.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return fail(res, new Error("Status must be 'Approved' or 'Rejected'"), 400);
        }

        const entry = await MaterialHistory.findById(versionId);
        if (!entry) {
            return fail(res, new Error("Material version not found"), 404);
        }

        entry.status = status;
        entry.approvalStatus = status;
        entry.approvedBy = userId;
        entry.approvalDate = new Date();

        // Mark as read by the person who approved/rejected it
        if (!entry.readBy.includes(userId)) {
            entry.readBy.push(userId);
        }

        await entry.save();

        return success(res, {
            message: `Material version ${status.toLowerCase()} successfully`,
            version: entry,
        }, 200);
    } catch (err) {
        return fail(res, err, 500);
    }
};
