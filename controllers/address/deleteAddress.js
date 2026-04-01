import Address from "../../models/address.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const deleteaddress = async (req, res) => {
  try {
    const addressdlt = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!addressdlt) {
      return fail(res, { message: "Address not found or unauthorized" }, 404);
    }
    return success(res, {
      message: "successfully deleted",
      data: addressdlt,
    });
  } catch (err) {
    console.error("deleteaddress error", err);
    return fail(res, err, 500);
  }
};

export default deleteaddress;
