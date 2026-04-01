import website_info from "../../models/websiteInfo.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const getwebinfo = async (req, res) => {
  try {
    const webinfo = await website_info.find();
    return success(res, webinfo, 200);
  } catch (err) {
    console.error('getwebinfo error:', err);
    return fail(res, err, 500);
  }
};

export default getwebinfo;
