import express from "express";
import authenticateToken from "../middlewares/verifyToken.js";
import addtowishlist from "../controllers/wishlist/addToWishlist.js";
import wishlist_list from "../controllers/wishlist/wishlistList.js";
import removewishlist from "../controllers/wishlist/removeWishlist.js";

const router = express.Router()

router.post('/', authenticateToken, addtowishlist)
router.get('/', authenticateToken, wishlist_list)
router.delete('/:item_id', authenticateToken, removewishlist)

export default router;
