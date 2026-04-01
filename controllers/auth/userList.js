import Usertable from "../../models/user.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const userlist = async (req, res) => {
  try {
    const {
      name,
      mobile,
      email,
      isEmailVerified,
      role,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Build Query
    const query = {};

    if (name) query.name = { $regex: name, $options: 'i' };
    if (mobile) query.mobile = { $regex: mobile, $options: 'i' };
    if (email) query.email = { $regex: email, $options: 'i' };
    if (isEmailVerified !== undefined) query.isEmailVerified = parseInt(isEmailVerified);
    if (role) {
      if (role === 'vendor' || role === 'brand') {
        query.role = { $in: ['vendor', 'brand'] };
      } else {
        query.role = role;
      }
    }

    // Date Range Filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Pagination Logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalRecords = await Usertable.countDocuments(query);

    const usersRaw = await Usertable.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const users = await Promise.all(usersRaw.map(async (user) => {
      // Fetch default address
      const Address = (await import("../../models/address.js")).default;
      const address = await Address.findOne({ userId: user._id, defaultaddress: 1 }).lean();
      return { ...user, address };
    }));

    return success(res, {
      users,
      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    }, 200);
  } catch (err) {
    console.error("userlist error:", err);
    return fail(res, err, 500);
  }
};

export default userlist;
