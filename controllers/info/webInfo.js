import website_info from "../../models/websiteInfo.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { s3Upload } from '../../utils/s3upload.js';



const webinfo = async (req, res) => {
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
      gstno
    } = req.body;
    const parseArrayField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch (e) {
        return [field];
      }
    };

    // Handle logo upload with S3
    let logo = null;
    if (req.files && (req.files.logo || Object.keys(req.files).length > 0)) {
      const files = req.files.logo || req.files;
      const uploadResults = await s3Upload('admin', files, 'website');
      if (uploadResults.length > 0) {
        logo = uploadResults[0];
      }
    }

    const websiteinfo = new website_info({
      website_name,
      mobile_no: parseArrayField(mobile_no),
      address: parseArrayField(address),
      email: parseArrayField(email),
      facebook,
      instagram,
      youtube,
      twitter,
      pinterest,
      gstno,
      logo,
    });


    const data = await websiteinfo.save();
    res.status(201).json({ status: "successfull", data });


  } catch (error) {
    return fail(res, { status: "faild", error: error.errors });;
  }
};



export default webinfo;
