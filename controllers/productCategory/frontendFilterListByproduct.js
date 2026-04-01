import product from "../../models/product.js";
import category from "../../models/category.js";

const frontendattributelistbyproduct = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const categorydata = await category
      .findById(req.params.id)
      .select("name parentId");

    let parentcategoryname = null;
    if (categorydata.parentId) {
      parentcategoryname = await category.findById(categorydata.parentId).select("name -_id");
    }

    const brands = await product.distinct("brand", {
      $or: [
        { categoryId: categoryId },
        { subcategoryId: categoryId },
        { subsubcategoryId: categoryId }
      ],
    });

    const weights = await product.distinct("weight", {
      $or: [
        { parent_category: categoryId },
        { child_category: categoryId },
      ], weight: { $gt: 0 }
    });
    const weightTypes = await product.distinct("weight_type", {
      $or: [
        { categoryId: categoryId },
        { subcategoryId: categoryId },
        { subsubcategoryId: categoryId }
      ],
    });
    // Repeat the process for other filters

    const combinedWeights = weights.map((weight, index) => ({
      weight,
      weightType: weightTypes[index],
    }));

    // Calculate min and max prices
    const minPrice = await product
      .findOne({}, { selling_price: 1 })
      .sort("selling_price");
    const maxPrice = await product
      .findOne({}, { selling_price: 1 })
      .sort("-selling_price");

    // Create an object containing available filters and their values
    const availableFilters = {
      brand: brands,
      combinedWeight: combinedWeights,
      minPrice,
      maxPrice,
      // Add other filters here
    };

    res.status(200).json({
      status: "success",
      availableFilters,
      categorydata,
      parentcategoryname
    });
  } catch (error) {
    console.log("frontendattributelistbyproduct error:", error);
    res.status(500).json({ status: "failed", error: error.message });
  }
};

export default frontendattributelistbyproduct;
