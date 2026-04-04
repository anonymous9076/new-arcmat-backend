import Brand from "../../models/brand.js";
import Usertable from "../../models/user.js";
import slugify from 'slugify';
import { success, fail } from '../../middlewares/responseHandler.js';
import mongoose from 'mongoose';
import { s3Upload } from '../../utils/s3upload.js';


const createbrand = async (req, res) => {
  try {
    const { name, country, description, website, isActive, showOnHomepage, shippingAddress, billingAddress } = req.body;
    if (!name) return fail(res, new Error('name is required'), 422);

    // Handle logo upload with S3
    let logo = req.body.logo;
    if (req.files && (req.files.brand_image || req.files.logo || Object.keys(req.files).length > 0)) {
      const files = req.files.brand_image || req.files.logo || req.files;
      const uploadResults = await s3Upload(req.user?.id || 'admin', files, 'brands');
      if (uploadResults.length > 0) {
        logo = uploadResults[0]; // Brand logo is usually a single image
      }
    }


    const slug = slugify(name, { lower: true });

    // Auto-assign userId from authenticated user if available
    const userId = req.user ? req.user.id : req.body.userId;

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    const brandData = {
      name,
      slug,
      country,
      logo,
      description,
      website,
      isActive: isActive !== undefined ? Number(isActive) : 1,
      showOnHomepage: showOnHomepage !== undefined ? Number(showOnHomepage) : 0,
      userId: userId || undefined,
      shippingAddress: shippingAddress || undefined,
      billingAddress: billingAddress || undefined,
    };

    const newBrand = new Brand(brandData);

    const data = await newBrand.save();

    // Sync Brand ID to Creator's User Profile
    if (userId) {
      await Usertable.findByIdAndUpdate(userId, {
        $addToSet: { selectedBrands: data._id }
      });
    }

    return success(res, data, 201);
  } catch (error) {
    console.error('createbrand error:', error);
    return fail(res, error, 422);
  }
};

export default createbrand;
