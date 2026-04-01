import Brand from "../../models/brand.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import mongoose from 'mongoose';

const brandsingle = async (req, res) => {
  try {
    let branddetail = await Brand.findById(req.params.id)
      .populate('userId', 'name email profile')
      .lean();

    // If not found by ID, try finding by userId
    if (!branddetail) {
      branddetail = await Brand.findOne({ userId: req.params.id })
        .populate('userId', 'name email profile')
        .lean();
    }

    if (!branddetail) return fail(res, new Error('brand detail not found'), 404);

    const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

    if (isValidId(branddetail.shippingAddress)) {
      branddetail.shippingAddress = await mongoose.model('address').findById(branddetail.shippingAddress).lean();
    }
    if (isValidId(branddetail.billingAddress)) {
      branddetail.billingAddress = await mongoose.model('address').findById(branddetail.billingAddress).lean();
    }

    return success(res, branddetail, 200);
  } catch (err) {
    console.error('brandsingle error:', err);
    return fail(res, err, 500);
  }
};

export default brandsingle;
