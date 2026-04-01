import banner from "../../models/banner.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const bannersingle = async (req, res) => {
  try {
    const bannerdetail = await banner.findById(req.params.id);
    if (!bannerdetail) {
      return res.status(404).send({ error: "bannerdetail not found" });
    }
    return success(res, bannerdetail);
  } catch (err) {
    res
      .status(500)
      .send({ error: "An error occurred while fetching banner details" });
  }
};

export default bannersingle;
