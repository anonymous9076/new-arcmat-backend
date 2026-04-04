import Project from "../../models/project.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload } from "../../utils/s3upload.js";

/**
 * Update an existing project belonging to the authenticated architect.
 */
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const architectId = req.user.id;

        const project = await Project.findOne({ _id: id, architectId });

        if (!project) {
            return fail(res, new Error("Project not found or access denied"), 404);
        }

        // Selected update of allowed fields only
        const allowedFields = ['projectName', 'clientName', 'phase', 'status', 'budget', 'description', 'size', 'type', 'coverImage', 'privacyControls'];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                // Special handling for coverImage to ensure it's a string
                if (field === 'coverImage') {
                    if (typeof req.body[field] === 'string' && req.body[field].trim() !== '') {
                        project[field] = req.body[field];
                    }
                } else if (field === 'projectName') {
                    // Normalize projectName: trim and collapse spaces
                    project[field] = req.body[field].trim().replace(/\s+/g, ' ');
                } else {
                    project[field] = req.body[field];
                }
            }
        });

        // Handle File Upload for coverImage
        if (req.files && (req.files.coverImage || req.files.file)) {
            const files = req.files.coverImage || req.files.file;
            const uploadResults = await s3Upload(architectId, files, 'projects/covers');
            if (uploadResults && uploadResults.length > 0) {
                project.coverImage = uploadResults[0].secure_url;
            }
        }

        const updatedProject = await project.save();
        return success(res, updatedProject, 200);
    } catch (err) {
        console.error("updateProject error:", err);
        return fail(res, err, 500);
    }
};

export default updateProject;
