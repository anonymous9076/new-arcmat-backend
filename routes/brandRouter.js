import express from "express";
import upload from "../middlewares/imageUploader.js";
import createbrand from "../controllers/brand/createBrand.js";
import getBrandList from "../controllers/brand/getBrandList.js";
import productbybrand from "../controllers/brand/frontendProductByBrand.js";
import updatebrand from "../controllers/brand/updateBrand.js";
import deletebrand from "../controllers/brand/deleteBrand.js";
import brandsingle from "../controllers/brand/brandSingle.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router()

router.post('/', authenticateToken(['admin', 'brand']), upload.brand.fields([
  { name: 'brand_image', maxCount: 1 },
]), createbrand);
router.get('/', getBrandList);
router.get('/products/:name', productbybrand);
router.get('/:id', brandsingle);
router.delete('/:id', authenticateToken(['admin']), deletebrand);
router.patch('/:id', authenticateToken(['admin', 'brand']), upload.brand.fields([
  { name: 'brand_image', maxCount: 1 },
]), updatebrand);
export default router;
