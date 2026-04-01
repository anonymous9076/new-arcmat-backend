import user from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const usersingle = async (req, res) => {
  const userId = req.params.id || req.user.id;

  // IDOR Check: Allow if admin or requesting own profile
  // IDOR Check: Allow if admin or requesting own profile
  const isSelf = !req.params.id || req.params.id.toString() === req.user.id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSelf) {
    return fail(res, { message: "Access denied" }, 403);
  }

  try {
    const userdetail = await user.findById(userId)
      .select('-password')
      .populate('selectedBrands', 'name logo slug isActive _id description website shippingAddress billingAddress')
      .populate('invitedProjects', 'projectName _id');

    if (!userdetail) return fail(res, new Error('user detail not found'), 404);
    return success(res, userdetail, 200);
  } catch (err) {
    console.error('usersingle error:', err);
    return fail(res, { message: "Internal server error" }, 500);
  }
};

export default usersingle;
