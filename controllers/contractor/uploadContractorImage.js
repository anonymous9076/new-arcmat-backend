import { s3Upload } from "../../utils/s3upload.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const uploadContractorImage = async (req, res) => {
    try {
        if (!req.file) {
            return fail(res, "No image file provided", 400);
        }

        const userId = req.body.userId || "temp";
        
        // Upload to S3 in a 'contractors' folder
        const uploadResults = await s3Upload(userId, req.file, 'contractors');
        
        if (uploadResults && uploadResults.length > 0) {
            return success(res, { 
                image: uploadResults[0], // Returns { public_id, secure_url }
                message: "Image uploaded successfully" 
            });
        } else {
            return fail(res, "Upload failed", 500);
        }
    } catch (error) {
        console.error("uploadContractorImage error:", error);
        return fail(res, error.message, 500);
    }
};

export default uploadContractorImage;
