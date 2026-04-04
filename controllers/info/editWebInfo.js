import website_info from "../../models/websiteInfo.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload, s3Delete } from '../../utils/s3upload.js';


const editwebinfo = async (req, res) => {
  try {
    const {
      website_name,
      mobile_no,
      address,
      email,
      facebook,
      instagram,
      youtube,
      twitter,
      pinterest,
      gstno,
    } = req.body;
    const parseArrayField = (field) => {
      if (!field) return undefined; // If not provided, don't update (or handle as empty array if intended)
      // Note: If you want to allow clearing the array, you might need to check for empty string or specific flag.
      // For now, let's assume if it's sent, we parse it.
      if (Array.isArray(field)) return field;
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch (e) {
        return [field];
      }
    };

    let updatedate = {
      website_name,
      facebook,
      instagram,
      youtube,
      twitter,
      pinterest,
      gstno,
    };

    if (mobile_no !== undefined) updatedate.mobile_no = parseArrayField(mobile_no);
    if (address !== undefined) updatedate.address = parseArrayField(address);
    if (email !== undefined) updatedate.email = parseArrayField(email);

    // Load existing info to handle logo deletion
    const existingInfo = await website_info.findById(`6563815007f92d08b1f7df3c`).lean();

    if (req.files && (req.files.logo || Object.keys(req.files).length > 0)) {
      const files = req.files.logo || req.files;
      const uploadResults = await s3Upload('admin', files, 'website');
      if (uploadResults.length > 0) {
        updatedate.logo = uploadResults[0];

        // Delete old logo if it was an S3 object
        if (existingInfo && existingInfo.logo && existingInfo.logo.public_id) {
          s3Delete(existingInfo.logo.public_id).catch(err => console.error('S3 cleanup error during webinfo update:', err));
        }
      }
    }

    const data = await website_info.findByIdAndUpdate(
      `6563815007f92d08b1f7df3c`,
      updatedate,
      { new: true }
    );

    if (!data) {
      return res
        .status(404)
        .json({ status: "failed", message: "no Record found" });
    }

    return success(res, { status: "successfully update", data: data });;
  } catch (err) {
    console.log(`  here is errror ${err}`);
    return fail(res, { status: "faild", errors: err });;
  }
};

export default editwebinfo;
