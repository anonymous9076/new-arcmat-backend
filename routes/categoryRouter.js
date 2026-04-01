import express from "express";
import createcategory from "../controllers/productCategory/createCategory.js";
import categorylist from "../controllers/productCategory/categoryList.js";
import categorysingle from "../controllers/productCategory/categorySingle.js";
import updatecategory from "../controllers/productCategory/updateCategory.js";
import getCategoryTree from "../controllers/productCategory/getCategoryTree.js";
import upload from "../middlewares/imageUploader.js";
import deletecategory from "../controllers/productCategory/deleteCategory.js";
import frontendcategorylist from "../controllers/productCategory/frontendCategoryList.js";
import frontendattributelistbycategory from "../controllers/productCategory/frontendFilterListBycategory.js";
import frontendattributelistbyproduct from "../controllers/productCategory/frontendFilterListByproduct.js";
import authenticateToken from "../middlewares/verifyToken.js";

const routercate = express.Router()

routercate.post('/', authenticateToken(['admin']), upload.category.fields([
  { name: 'category_image', maxCount: 1 },
]), createcategory);

routercate.get('/frontedcategorylist', frontendcategorylist);
routercate.get('/tree', getCategoryTree);
routercate.get('/attributelist/:id', frontendattributelistbyproduct);
routercate.get('/attribute-by-category/:id', frontendattributelistbycategory);

routercate.get('/', categorylist);

routercate.get('/:id', categorysingle);

routercate.patch('/:id', authenticateToken(['admin']), upload.category.fields([
  { name: 'category_image', maxCount: 1 },
]), updatecategory);

routercate.delete('/:id', authenticateToken(['admin']), deletecategory);

export default routercate;
