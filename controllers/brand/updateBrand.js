import Brand from "../../models/brand.js";
import slugify from 'slugify';
import { success, fail } from '../../middlewares/responseHandler.js';
import mongoose from 'mongoose';
import { cloudinaryUpload, cloudinaryDelete } from '../../utils/cloudinaryupload.js';


const updatebrand = async (req, res) => {
  try {
    const { name, country, description, website, isActive, showOnHomepage, userId, shippingAddress, billingAddress } = req.body;

    // Load existing brand to handle image deletion
    const existingBrand = await Brand.findById(req.params.id).lean();
    if (!existingBrand) return fail(res, new Error('brand not found'), 404);

    let logo = req.body.logo;
    if (req.files && (req.files.brand_image || req.files.logo || Object.keys(req.files).length > 0)) {
      const files = req.files.brand_image || req.files.logo || req.files;
      const uploadResults = await cloudinaryUpload(req.user?.id || 'admin', files, 'brands');
      if (uploadResults.length > 0) {
        logo = uploadResults[0];

        // Delete old logo if it was a Cloudinary object
        if (existingBrand.logo && existingBrand.logo.public_id) {
          cloudinaryDelete(existingBrand.logo.public_id).catch(err => console.error('Cloudinary cleanup error during brand update:', err));
        }
      }
    }


    const updateObj = {};
    if (name !== undefined) {
      updateObj.name = name;
      updateObj.slug = slugify(name, { lower: true });
    }
    if (country !== undefined) updateObj.country = country;
    if (description !== undefined) updateObj.description = description;
    if (website !== undefined) updateObj.website = website;
    if (isActive !== undefined) updateObj.isActive = Number(isActive);
    if (showOnHomepage !== undefined) updateObj.showOnHomepage = Number(showOnHomepage);
    if (userId !== undefined) updateObj.userId = userId;

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    if (shippingAddress !== undefined) updateObj.shippingAddress = shippingAddress;
    if (billingAddress !== undefined) updateObj.billingAddress = billingAddress;
    if (logo !== undefined) updateObj.logo = logo;

    const updatedbrand = await Brand.findByIdAndUpdate(req.params.id, updateObj, { new: true, runValidators: true });

    if (!updatedbrand) return fail(res, new Error('brand not found'), 404);

    return success(res, updatedbrand, 200);
  } catch (err) {
    console.error('updatebrand error:', err);
    return fail(res, err, 422);
  }
};

export default updatebrand;
