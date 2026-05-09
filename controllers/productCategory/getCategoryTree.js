import Category from "../../models/category.js";
import Product from "../../models/product.js";
import Brand from "../../models/brand.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getCategoryTree = async (req, res) => {
  try {
    const { ownerType } = req.query;

    let categories = await Category.find().lean();
    
    if (ownerType) {
      // 1. Get all brands of this type (handling null/undefined as 'brand')
      const brandQuery = ownerType === 'brand' 
        ? { $or: [{ ownerType: 'brand' }, { ownerType: { $exists: false } }, { ownerType: null }] } 
        : { ownerType };
      
      const brands = await Brand.find(brandQuery).select('_id').lean();
      const brandIds = brands.map(b => b._id);

      // 2. Get distinct category IDs from products of these brands
      const [catIds, subcatIds, subsubcatIds] = await Promise.all([
        Product.distinct('categoryId', { brand: { $in: brandIds } }),
        Product.distinct('subcategoryId', { brand: { $in: brandIds } }),
        Product.distinct('subsubcategoryId', { brand: { $in: brandIds } }),
      ]);

      const activeCategoryIds = new Set([
        ...catIds.map(id => id.toString()),
        ...subcatIds.map(id => id.toString()),
        ...subsubcatIds.map(id => id.toString())
      ]);

      // 3. Mark categories as active if they have products or have active descendants
      const map = {};
      categories.forEach(cat => {
        map[cat._id.toString()] = { ...cat, isActiveBranch: activeCategoryIds.has(cat._id.toString()) };
      });

      // Bottom-up pass to mark parents of active categories
      // We sort by level descending to ensure we process children before parents
      const sortedByLevel = [...categories].sort((a, b) => (b.level || 0) - (a.level || 0));
      sortedByLevel.forEach(cat => {
        if (cat.parentId && map[cat._id.toString()].isActiveBranch) {
          const parentIdStr = cat.parentId.toString();
          if (map[parentIdStr]) {
              map[parentIdStr].isActiveBranch = true;
          }
        }
      });

      // 4. Filter categories to only those in active branches
      categories = categories.filter(cat => map[cat._id.toString()].isActiveBranch);
    }

    const map = {};
    categories.forEach(cat => {
      map[cat._id] = { ...cat, children: [] };
    });

    const tree = [];
    categories.forEach(cat => {
      const node = map[cat._id];
      if (cat.parentId) {
        const parent = map[cat.parentId];
        if (parent) parent.children.push(node);
        else tree.push(node);
      } else {
        tree.push(node);
      }
    });

    return success(res, tree, 200);
  } catch (err) {
    console.error('getCategoryTree error:', err);
    return fail(res, err, 500);
  }
};

export default getCategoryTree;
