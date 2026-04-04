import banner from "../../models/banner.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Delete } from "../../utils/s3upload.js";

const deletebanner = async (req, res) => {
  try {
    const existingBanner = await banner.findById(req.params.id);
    if (!existingBanner) {
      return fail(res, { message: "Banner not found" }, 404);
    }

    // Cleanup banner from S3
    if (existingBanner.banner && existingBanner.banner.public_id) {
      s3Delete(existingBanner.banner.public_id).catch(err => console.error('S3 cleanup error during banner deletion:', err));
    }

    const bannerdel = await banner.findByIdAndDelete(req.params.id);
    return success(res, bannerdel);
  } catch (err) {
    console.error("deletebanner error:", err);
    return fail(res, { message: "An error occurred while deleting banner" }, 500);
  }
};

export default deletebanner;
