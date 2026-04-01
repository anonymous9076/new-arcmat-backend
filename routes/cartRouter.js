import express from "express";
import addtocart from "../controllers/cart/addToCart.js";
import addtocartlist from "../controllers/cart/addToCartList.js";
import addtocartdelete from "../controllers/cart/addToCartDelete.js";
import cartlist from "../controllers/cart/cartList.js";
import authenticateToken from "../middlewares/verifyToken.js";
import updateCartQuantity from "../controllers/cart/updateCartQuantity.js";
import cartcount from "../controllers/cart/cartCount.js";
import checkuser from "../middlewares/checkUser.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Public/Checkuser endpoints
router.get('/count', checkuser, cartcount);

// Protected endpoints (Require Authentication)
router.post('/', authenticateToken, addtocart);
router.get('/', authenticateToken, addtocartlist); // Renamed from addtocartlist for simplicity, restricted to user
router.post('/update-quantity', authenticateToken, updateCartQuantity);
router.delete('/:cart_id', validateObjectId, authenticateToken, addtocartdelete);

// Admin-only endpoints
router.get('/admin/list', authenticateToken(['admin']), cartlist);

export default router;
