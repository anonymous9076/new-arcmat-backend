import banner from "../../models/banner.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cloudinaryUpload } from '../../utils/cloudinaryupload.js';


const createbanner = async (req, res) => {
  try {
    const { banner_name, banner_link, banner_alt, status, description, banner_type } = req.body;
    // Handle banner upload with Cloudinary
    let bannerDetails = null;
    if (req.files && (req.files.banner || Object.keys(req.files).length > 0)) {
      const files = req.files.banner || req.files;
      const uploadResults = await cloudinaryUpload('admin', files, 'banners');
      if (uploadResults.length > 0) {
        bannerDetails = uploadResults[0];
      }
    }

    const addbanner = new banner({
      banner_name,
      status: Number(status),
      description,
      banner_type,
      banner_link,
      banner_alt,
      banner: bannerDetails,
    });

    const data = await addbanner.save();
    return success(res, data, 201);
  } catch (error) {
    console.error("createbanner error:", error);
    return fail(res, error, 500);
  }
};

export default createbanner;
