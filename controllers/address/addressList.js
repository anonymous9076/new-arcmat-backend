import Address from "../../models/address.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const addresslist = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      search,
      defaultaddress,
      city,
      state,
      pincode,
      page = 1,
      limit = 10
    } = req.query;

    const query = { userId };

    if (defaultaddress !== undefined) query.defaultaddress = defaultaddress;
    if (city) query.city = new RegExp(city, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (pincode) query.pincode = pincode;

    if (search) {
      query.$or = [
        { first_name: new RegExp(search, 'i') },
        { last_name: new RegExp(search, 'i') },
        { address1: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { state: new RegExp(search, 'i') },
        { pincode: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Address.countDocuments(query);
    const list = await Address.find(query)
      .sort({ defaultaddress: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return success(res, {
      data: list,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }, 200);
  } catch (err) {
    console.log("addresslist error", err);
    return fail(res, err, 500);
  }
};

export default addresslist;
