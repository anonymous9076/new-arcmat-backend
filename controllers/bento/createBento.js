import Bento from '../../models/bento.js';
import { success, fail } from "../../middlewares/responseHandler.js";
import { cloudinaryUpload } from "../../utils/cloudinaryupload.js";

const createBentoItem = async (req, res) => {
    try {
        const { title, subtitle, link } = req.body;

        const lastItem = await Bento.findOne().sort({ order: -1 });
        const newOrder = lastItem ? lastItem.order + 1 : 1;

        let imageData = {};

        if (req.files && (req.files.image || req.files.file)) {
            const files = req.files.image || req.files.file;
            const uploadResults = await cloudinaryUpload(req.user.id, files, 'bento');
            if (uploadResults && uploadResults.length > 0) {
                imageData = {
                    public_id: uploadResults[0].public_id,
                    url: uploadResults[0].secure_url
                };
            }
        }

        const newBento = new Bento({
            title,
            subtitle,
            link,
            image: imageData,
            order: newOrder
        });

        await newBento.save();
        return success(res, newBento, 201);
    } catch (err) {
        console.error("createBento error:", err);
        return fail(res, err, 500);
    }
}

export default createBentoItem;
