import Address from "../../models/address.js";
import { success, fail } from '../../middlewares/responseHandler.js';


const createaddress = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      mobile,
      pincode,
      city,
      state,
      country,
      address1,
      address2,
      defaultaddress
    } = req.body;

    const userId = req.user.id;

    let isDefault = 0;

    if (defaultaddress == 1) {
      isDefault = 1;
    } else {
      const count = await Address.countDocuments({ userId });
      if (count === 0) {
        isDefault = 1;
      }
    }

    // If making this one default, unset others first
    if (isDefault === 1) {
      await Address.updateMany({ userId }, { defaultaddress: 0 });
    }

    const newAddress = new Address({
      first_name,
      last_name,
      email,
      mobile,
      pincode,
      city,
      state,
      country,
      address1,
      address2,
      userId,
      defaultaddress: isDefault,
    });

    const response = await newAddress.save();

    return success(res, response, 201);
  } catch (errors) {
    console.error("createaddress failed", errors);
    return fail(res, errors, 500);
  }
};

export default createaddress;
