import Bento from '../../models/bento.js';
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload } from "../../utils/cloudinaryupload.js";

const updateBentoItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, link } = req.body;

        let bentoItem = await Bento.findById(id);
        if (!bentoItem) {
            return fail(res, new Error("Bento item not found"), 404);
        }

        if (title !== undefined) bentoItem.title = title;
        if (subtitle !== undefined) bentoItem.subtitle = subtitle;
        if (link !== undefined) bentoItem.link = link;

        if (req.files && (req.files.image || req.files.file)) {
            const files = req.files.image || req.files.file;
            const uploadResults = await cloudinaryUpload(req.user.id, files, 'bento');
            if (uploadResults && uploadResults.length > 0) {
                bentoItem.image = {
                    public_id: uploadResults[0].public_id,
                    url: uploadResults[0].secure_url
                };
            }
        }

        await bentoItem.save();
        return success(res, bentoItem, 200);
    } catch (err) {
        console.error("updateBento error:", err);
        return fail(res, err, 500);
    }
}

export default updateBentoItem;
