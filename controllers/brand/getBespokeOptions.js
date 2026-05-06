import Brand from "../../models/brand.js";
import Product from "../../models/product.js";
import Usertable from "../../models/user.js";
import Contractor from "../../models/contractor.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getBespokeOptions = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).lean();
    if (!brand) return fail(res, new Error('brand not found'), 404);

    const currentUserId = req.user?.id || req.user?._id;
    if (req.user?.role === 'brand' && String(brand.userId) !== String(currentUserId)) {
      return fail(res, new Error('You can only edit your own bespoke page'), 403);
    }

    const [products, retailers, contractors] = await Promise.all([
      Product.find({ brand: brand._id })
        .select('product_name product_images description status brand')
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean(),
      Usertable.find({
        role: 'retailer',
        selectedBrands: brand._id,
        isActive: 1
      })
        .select('name email mobile profile retailerProfile selectedBrands')
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean(),
      Contractor.find({
        status: 'approved'
      })
        .select('businessName slug tagline profileImage location experienceYears isVerified status')
        .sort({ isFeatured: -1, isTopRated: -1, updatedAt: -1 })
        .limit(200)
        .lean()
    ]);

    return success(res, { products, retailers, contractors }, 200);
  } catch (err) {
    console.error('getBespokeOptions error:', err);
    return fail(res, err, 500);
  }
};

export default getBespokeOptions;
