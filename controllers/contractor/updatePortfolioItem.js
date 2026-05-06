import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { s3Upload } from "../../utils/s3upload.js";

const updatePortfolioItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const updates = { ...req.body };

        const item = await ContractorPortfolioItem.findById(itemId).populate("contractorId", "userId");
        if (!item) {
            return fail(res, "Portfolio item not found", 404);
        }

        if (req.files && req.files.length > 0) {
            const uploadedFiles = await s3Upload(item.contractorId.userId, req.files, "contractor-portfolio");
            const images = [];
            const videos = [];

            uploadedFiles.forEach((file, index) => {
                const mimeType = req.files[index]?.mimetype || "";
                if (mimeType.startsWith("video/")) {
                    videos.push(file.secure_url);
                } else {
                    images.push(file);
                }
            });

            updates.images = [...(item.images || []), ...images];
            updates.videos = [...(item.videos || []), ...videos];
        }

        const updatedItem = await ContractorPortfolioItem.findByIdAndUpdate(
            itemId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        return success(res, updatedItem);
    } catch (error) {
        console.error("updatePortfolioItem error:", error);
        return fail(res, error, 500);
    }
};

export default updatePortfolioItem;
