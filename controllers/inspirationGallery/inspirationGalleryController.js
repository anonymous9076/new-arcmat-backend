import InspirationGallery from '../../models/inspirationgallery.js';
import Project from '../../models/project.js';
import Usertable from '../../models/user.js';
import Moodboard from '../../models/moodboard.js';
import mongoose from 'mongoose';
import { success, fail } from "../../middlewares/responseHandler.js";

export const getFeaturedGallery = async (req, res) => {
    try {
        const items = await InspirationGallery.find()
            .populate('architectId', 'name profile')
            .populate('projectId', 'projectName')
            .sort({ order: 1 });

        return success(res, items, 200);
    } catch (err) {
        console.error("getFeaturedGallery error:", err);
        return fail(res, err, 500);
    }
};

export const getArchitectsWithRenders = async (req, res) => {
    try {
        const moodboardsWithRenders = await Moodboard.find({
            'customPhotos.tags': 'Render',
            'customPhotos.allowInGallery': true
        }).select('userId customPhotos');

        const architectMap = {};

        for (const mb of moodboardsWithRenders) {
            const aId = mb.userId.toString();
            if (!architectMap[aId]) {
                architectMap[aId] = 0;
            }
            const renderCount = mb.customPhotos.filter(p => (p.tags || []).includes('Render') && p.allowInGallery === true).length;
            architectMap[aId] += renderCount;
        }

        const architectIds = Object.keys(architectMap);

        const architects = await Usertable.find({ '_id': { $in: architectIds } }).select('name email profile professionalType');

        const result = architects.map(arch => ({
            ...arch.toObject(),
            renderCount: architectMap[arch._id.toString()]
        }));

        return success(res, result, 200);
    } catch (err) {
        console.error("getArchitectsWithRenders error:", err);
        return fail(res, err, 500);
    }
};

export const getArchitectRenders = async (req, res) => {
    try {
        const { architectId } = req.params;

        const moodboards = await Moodboard.find({
            userId: architectId,
            'customPhotos.tags': 'Render',
            'customPhotos.allowInGallery': true
        })
            .select('moodboard_name customPhotos projectId createdAt')
            .populate('projectId', 'projectName');

        let allRenders = [];
        for (const mb of moodboards) {
            const renders = mb.customPhotos.filter(p => (p.tags || []).includes('Render') && p.allowInGallery === true);
            for (const render of renders) {
                allRenders.push({
                    _id: render.id,
                    public_id: render.id,
                    imageUrl: render.previewUrl,
                    title: render.title || mb.moodboard_name,
                    uploadedAt: mb.createdAt,
                    projectId: mb.projectId ? mb.projectId._id : null,
                    projectName: mb.projectId ? mb.projectId.projectName : 'Unknown Project',
                    architectId
                });
            }
        }

        const featuredItems = await InspirationGallery.find({ architectId }).select('renderId');
        const featuredRenderIds = new Set(featuredItems.map(item => item.renderId));

        allRenders = allRenders.map(render => ({
            ...render,
            isFeatured: featuredRenderIds.has(render.public_id)
        }));

        allRenders.sort((a, b) => b.uploadedAt - a.uploadedAt);

        return success(res, allRenders, 200);
    } catch (err) {
        console.error("getArchitectRenders error:", err);
        return fail(res, err, 500);
    }
};

export const addToFeaturedGallery = async (req, res) => {
    try {
        const { renderId, imageUrl, title, architectId, projectId } = req.body;

        const existing = await InspirationGallery.findOne({ renderId });
        if (existing) {
            return fail(res, "Render is already featured", 400);
        }

        const lastItem = await InspirationGallery.findOne().sort({ order: -1 });
        const newOrder = lastItem ? lastItem.order + 1 : 1;

        const newItem = new InspirationGallery({
            renderId,
            imageUrl,
            title,
            architectId,
            projectId,
            order: newOrder
        });

        await newItem.save();
        return success(res, newItem, 201);
    } catch (err) {
        console.error("addToFeaturedGallery error:", err);
        return fail(res, err, 500);
    }
};

export const removeFromFeaturedGallery = async (req, res) => {
    try {
        const { id } = req.params;

        let item = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            item = await InspirationGallery.findById(id);
        }

        if (!item) {
            item = await InspirationGallery.findOne({ renderId: id });
        }

        if (!item) {
            return fail(res, "Featured item not found", 404);
        }

        await InspirationGallery.findByIdAndDelete(item._id);

        return success(res, { message: "Item removed from gallery" }, 200);
    } catch (err) {
        console.error("removeFromFeaturedGallery error:", err);
        return fail(res, err, 500);
    }
};
