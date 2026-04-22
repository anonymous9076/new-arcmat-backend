import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';


const updateuser = async (req, res) => {
  const userId = req.params.id || req.user.id;
  try {
    // IDOR Check
    const isSelf = !req.params.id || req.params.id.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return fail(res, { message: "Access denied" }, 403);
    }

    // Mass Assignment Protection: Whitelist fields
    const allowedFields = ['name', 'mobile', 'profile', 'professionalType', 'retailerProfile', 'selectedBrands'];
    if (req.user.role === 'admin') {
      allowedFields.push('role', 'isActive', 'isEmailVerified', 'isVerified');
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return fail(res, { message: "No valid fields to update" }, 400);
    }

    const updatedUser = await Usertable.findByIdAndUpdate(userId, updates, { new: true }).select('-password').populate('selectedBrands', 'name logo slug isActive _id description website shippingAddress billingAddress');

    if (!updatedUser) {
      return fail(res, { message: "User not found" }, 404);
    }

    return success(res, updatedUser);
  } catch (err) {
    console.error(`Error: ${err}`);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default updateuser;
