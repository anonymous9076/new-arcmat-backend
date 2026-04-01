import express from "express";
import addtocartdelete from "../controllers/cart/addToCartDelete.js";
import authenticateToken from "../middlewares/verifyToken.js";
import updateCartQuantity from "../controllers/cart/updateCartQuantity.js";
import cartcount from "../controllers/cart/cartCount.js";
import checkuser from "../middlewares/checkUser.js";
import createorder from "../controllers/order/createOrder.js";
import orderlist from "../controllers/order/orderList.js";
import singleorder from "../controllers/order/singleOrder.js";
import updateorderstatus from "../controllers/order/updateOrderStatus.js";
import orderlistbyuser from "../controllers/order/orderListByUser.js";

const router = express.Router()

router.post('/', authenticateToken, createorder)
router.get('/', orderlist)
router.get('/orderbyuser', authenticateToken, orderlistbyuser)
router.get('/:id', singleorder)
router.get('/cartcount', checkuser, cartcount)
router.post('/changestatus/:id', updateorderstatus)
router.delete('/:cart_id', addtocartdelete)

export default router;
