import banner from "../../models/banner.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const bannerlist = async (req, res) => {
  try {
    const data = await banner.find();
    return success(res, data);

  } catch (err) {
    console.log(`  here is errror ${err}`);
    return fail(res, { status: "faild", errors: err });

  }
}

export default bannerlist;
