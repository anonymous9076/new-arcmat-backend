import Address from "../../models/address.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const addresssingle = async (req, res) => {
  const addressId = req.params.id;
  try {
    const addressdetail = await Address.findOne({ _id: addressId, userId: req.user.id });
    if (!addressdetail) {
      return fail(res, { message: "Address not found or unauthorized" }, 404);
    }

    return success(res, addressdetail, 200);
  } catch (err) {
    console.error("addresssingle error", err);
    return fail(res, err, 500);
  }
};

export default addresssingle;
