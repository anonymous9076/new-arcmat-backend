import banner from "../../models/banner.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload, s3Delete } from '../../utils/s3upload.js';


const updatebanner = async (req, res) => {
  try {
    const { banner_name, banner_link, status, description, banner_alt, banner_type } = req.body;

    const bannerobj = {};
    if (banner_name !== undefined) bannerobj.banner_name = banner_name;
    if (banner_link !== undefined) bannerobj.banner_link = banner_link;
    if (description !== undefined) bannerobj.description = description;
    if (banner_alt !== undefined) bannerobj.banner_alt = banner_alt;
    if (banner_type !== undefined) bannerobj.banner_type = banner_type;
    if (status !== undefined) bannerobj.status = Number(status);

    // Load existing banner to handle image deletion
    const existingBanner = await banner.findById(req.params.id).lean();
    if (!existingBanner) {
      return fail(res, { message: "Banner not found" }, 404);
    }

    if (req.files && (req.files.banner || Object.keys(req.files).length > 0)) {
      const files = req.files.banner || req.files;
      const uploadResults = await s3Upload('admin', files, 'banners');
      if (uploadResults.length > 0) {
        bannerobj.banner = uploadResults[0];

        // Delete old banner if it was an S3 object
        if (existingBanner.banner && existingBanner.banner.public_id) {
          s3Delete(existingBanner.banner.public_id).catch(err => console.error('S3 cleanup error during banner update:', err));
        }
      }
    }

    const updatedbanner = await banner.findByIdAndUpdate(req.params.id, bannerobj, { new: true });

    if (!updatedbanner) {
      return fail(res, { message: "Banner not found" }, 404);
    }

    return success(res, updatedbanner);

  } catch (err) {
    console.error(`updatebanner error:`, err);
    return fail(res, err, 500);
  }


}

export default updatebanner;
