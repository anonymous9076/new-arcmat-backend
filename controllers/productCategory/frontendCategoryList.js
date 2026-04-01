// Import necessary modules
import category from '../../models/category.js';

// Create a route for fetching all categories with subcategories
const frontendcategorylist = async (req, res) => {
  try {
    // Fetch all active categories from the database
    const categories = await category.find({ isActive: 1 });

    // Organize categories into main and subcategories
    const mainCategories = [];
    const categoriesMap = new Map();

    // Populate the categoriesMap with categories
    categories.forEach((cat) => {
      categoriesMap.set(cat._id.toString(), { ...cat._doc, subcategories: [] });
    });

    // Identify main categories and add subcategories
    categories.forEach((cat) => {
      if (!cat.parentId || cat.parentId === null) {
        mainCategories.push(categoriesMap.get(cat._id.toString()));
      } else {
        const parentCategory = categoriesMap.get(cat.parentId.toString());
        if (parentCategory) {
          parentCategory.subcategories.push(cat);
        }
      }
    });

    // Send the organized categories as a response
    res.status(200).json({ status: 'success', data: mainCategories });
  } catch (error) {
    res.status(500).json({ status: 'failed', error: error.message });
  }
};

// Export the router
export default frontendcategorylist;
