import variant from "../../models/productVariant.js";
import category from "../../models/category.js";
import mongoose from "mongoose";
import { success, fail } from "../../middlewares/responseHandler.js";

const singleproductvariant = async (req, res) => {
  try {
    const data = await variant.findById(req.params.id)
      .populate({
        path: 'productId',
        populate: [
          { path: 'brand' },
          { path: 'categoryId', select: 'name' },
          { path: 'subcategoryId', select: 'name' },
          { path: 'subsubcategoryId', select: 'name' },
          { path: 'createdBy', select: 'name email role' }
        ]
      });

    if (!data) {
      return fail(res, new Error("Variant not found"), 404);
    }

    const productData = data.productId;
    const parentcategory = productData && productData.categoryId ? [productData.categoryId] : [];
    const childcategory = productData && productData.subcategoryId ? [productData.subcategoryId] : [];
    const subsubcategory = productData && productData.subsubcategoryId ? [productData.subsubcategoryId] : [];

    const slug = productData && productData.product_name
      ? productData.product_name.replace(/\s/g, "-").toLowerCase()
      : "";

    return success(res, { data, parentcategory, childcategory, subsubcategory, slug }, 200);
  } catch (err) {
    console.error("singleproductvariant error:", err);
    return fail(res, err, 500);
  }
};


export default singleproductvariant;
