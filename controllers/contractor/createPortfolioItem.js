import Contractor from "../../models/contractor.js";
import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import { s3Upload } from "../../utils/s3upload.js";

const createPortfolioItem = async (req, res) => {
    try {
        const { contractorId } = req.params;
        const { title, description, location, projectType, displayOrder } = req.body;

        const contractor = await Contractor.findById(contractorId);
        if (!contractor) {
            return fail(res, "Contractor not found", 404);
        }

        if (!req.files || req.files.length === 0) {
            return fail(res, "Please upload at least one image or video", 400);
        }

        const uploadedFiles = await s3Upload(contractor.userId, req.files, "contractor-portfolio");
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

        const portfolioItem = await ContractorPortfolioItem.create({
            contractorId,
            title: title?.trim() || "Portfolio work",
            description,
            location,
            projectType,
            displayOrder,
            images,
            videos
        });

        return success(res, portfolioItem, 201);
    } catch (error) {
        console.error("createPortfolioItem error:", error);
        return fail(res, error, 500);
    }
};

export default createPortfolioItem;
