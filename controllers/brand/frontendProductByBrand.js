import product from "../../models/product.js";
import Brand from "../../models/brand.js";
import { success, fail } from '../../middlewares/responseHandler.js';

const productbybrand = async (req, res) => {
  try {
    const brandParam = req.params.name;
    // Find brand by name or slug
    const brandDoc = await Brand.findOne({
      $or: [
        { name: brandParam },
        { slug: brandParam }
      ]
    });

    if (!brandDoc) {
      return fail(res, new Error('Brand not found'), 404);
    }

    const productbybrandlist = await product.find({ brand: brandDoc._id })
      .select('product_name _id selling_price mrp_price product_images')
      .populate('brand'); // Optional: if frontend needs brand details for each product card

    return success(res, { status: "sucessfully", data: productbybrandlist });

  } catch (err) {
    console.log(`  here is errror ${err}`);
    return fail(res, { status: "faild", errors: err });

  }
}

export default productbybrand;
