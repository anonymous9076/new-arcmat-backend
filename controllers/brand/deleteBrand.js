import Brand from "../../models/brand.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import { cloudinaryDelete } from "../../utils/cloudinaryupload.js";


const deletebrand = async (req, res) => {
  try {
    const branddata = await Brand.findById(req.params.id);
    if (!branddata) return fail(res, new Error('brand not found'), 404);

    // Cleanup logo from Cloudinary
    if (branddata.logo && branddata.logo.public_id) {
      cloudinaryDelete(branddata.logo.public_id).catch(err => console.error('Cloudinary cleanup error during brand deletion:', err));
    }

    await Brand.findByIdAndDelete(req.params.id);
    return success(res, { message: 'successfully deleted', data: branddata }, 200);
  } catch (err) {
    console.error('deletebrand error:', err);
    return fail(res, err, 500);
  }
};


export default deletebrand;
