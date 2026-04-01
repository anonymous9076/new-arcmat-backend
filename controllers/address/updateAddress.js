import Address from "../../models/address.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const updateaddress = async (req, res) => {
  const addressId = req.params.id;
  try {
    const userId = req.user.id;
    const { defaultaddress } = req.body;

    // Check ownership first
    const existing = await Address.findOne({ _id: addressId, userId });
    if (!existing) {
      return fail(res, { message: "Address not found or unauthorized" }, 404);
    }

    // If setting as default, unset others
    if (defaultaddress == 1) {
      await Address.updateMany({ userId }, { defaultaddress: 0 });
    }

    const updatedaddress = await Address.findByIdAndUpdate(addressId, req.body, {
      new: true,
    });

    return success(res, updatedaddress, 200);
  } catch (err) {
    console.error(`updateaddress error: ${err}`);
    return fail(res, err, 500);
  }
};

export default updateaddress;
