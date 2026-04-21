import express from 'express';
import authenticateToken from '../middlewares/verifyToken.js';
import { requireRetailerRole } from '../middlewares/retailerMiddleware.js';
import upsertRetailerProduct from '../controllers/retailer/upsertRetailerProduct.js';
import getRetailerProducts from '../controllers/retailer/getRetailerProducts.js';
import updateRetailerBrands from '../controllers/retailer/updateRetailerBrands.js';
import getRetailerBrands from '../controllers/retailer/getRetailerBrands.js';
import getBrandInventory from '../controllers/retailer/getBrandInventory.js';
import bulkAddInventory from '../controllers/retailer/bulkAddInventory.js';
import deleteRetailerProduct from '../controllers/retailer/deleteRetailerProduct.js';
import getRetailerProductDetail from '../controllers/retailer/getRetailerProductDetail.js';
import bulkRemoveInventory from '../controllers/retailer/bulkRemoveInventory.js';
import checkuser from '../middlewares/checkUser.js';
import multer from 'multer';

const upload = multer();
const router = express.Router();

// Public/General access routes (checkuser allows optional auth)
router.get('/products', checkuser, getRetailerProducts);
router.get('/products/detail/:productId', checkuser, getRetailerProductDetail);

// Protected routes requiring authentication
router.use(authenticateToken(['retailer', 'admin']));

router.get('/brands', requireRetailerRole, getRetailerBrands);
router.get('/brands/:brandId/inventory', requireRetailerRole, getBrandInventory);
router.patch('/brands', requireRetailerRole, updateRetailerBrands);
router.post('/products', upload.none(), requireRetailerRole, upsertRetailerProduct);
router.post('/inventory/bulk-add', requireRetailerRole, bulkAddInventory);
router.post('/inventory/bulk-remove', requireRetailerRole, bulkRemoveInventory);
router.patch('/products/:id', upload.none(), requireRetailerRole, upsertRetailerProduct);
router.delete('/products/:id', requireRetailerRole, deleteRetailerProduct);

export default router;
