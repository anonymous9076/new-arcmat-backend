import Project from "../../models/project.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload, cloudinaryDelete } from "../../utils/cloudinaryupload.js";
import InspirationGallery from "../../models/inspirationgallery.js";

export const uploadRender = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        const project = await Project.findById(id);
        if (!project) {
            return fail(res, "Project not found", 404);
        }

        if (project.architectId.toString() !== req.user.id && req.user.role !== 'admin') {
            return fail(res, "Unauthorized", 403);
        }

        if (!req.files || (!req.files.image && !req.files.file)) {
            return fail(res, "No file uploaded", 400);
        }

        const files = req.files.image || req.files.file;
        const uploadResults = await cloudinaryUpload(req.user.id, files, 'project_renders');

        let newRenderData = null;
        if (uploadResults && uploadResults.length > 0) {
            newRenderData = {
                imageUrl: uploadResults[0].secure_url,
                public_id: uploadResults[0].public_id,
                title: title || ''
            };

            if (!project.renders) {
                project.renders = [];
            }
            project.renders.push(newRenderData);
            await project.save();
            return success(res, project.renders, 201);
        }

        return fail(res, "Upload failed", 500);
    } catch (err) {
        console.error("uploadRender error:", err);
        return fail(res, err, 500);
    }
};

export const deleteRender = async (req, res) => {
    try {
        const { id, renderId } = req.params;

        const project = await Project.findById(id);
        if (!project) {
            return fail(res, "Project not found", 404);
        }

        if (project.architectId.toString() !== req.user.id && req.user.role !== 'admin') {
            return fail(res, "Unauthorized", 403);
        }

        const renderIndex = project.renders.findIndex(r => r._id.toString() === renderId);
        if (renderIndex === -1) {
            return fail(res, "Render not found", 404);
        }

        const renderToDelete = project.renders[renderIndex];

        if (renderToDelete.public_id) {
            await cloudinaryDelete(renderToDelete.public_id);
        }

        await InspirationGallery.deleteMany({ renderId: renderToDelete.public_id });

        project.renders.splice(renderIndex, 1);
        await project.save();

        return success(res, project.renders, 200);
    } catch (err) {
        console.error("deleteRender error:", err);
        return fail(res, err, 500);
    }
};
