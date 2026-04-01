import banner from "../../models/banner.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cloudinaryDelete } from "../../utils/cloudinaryupload.js";

const deletebanner = async (req, res) => {
  try {
    const existingBanner = await banner.findById(req.params.id);
    if (!existingBanner) {
      return fail(res, { message: "Banner not found" }, 404);
    }

    // Cleanup banner from Cloudinary
    if (existingBanner.banner && existingBanner.banner.public_id) {
      cloudinaryDelete(existingBanner.banner.public_id).catch(err => console.error('Cloudinary cleanup error during banner deletion:', err));
    }

    const bannerdel = await banner.findByIdAndDelete(req.params.id);
    return success(res, bannerdel);
  } catch (err) {
    console.error("deletebanner error:", err);
    return fail(res, { message: "An error occurred while deleting banner" }, 500);
  }
};

export default deletebanner;
