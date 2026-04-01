import express from "express";
import multer from "multer";
import authenticateToken from "../middlewares/verifyToken.js";
import addresslist from "../controllers/address/addressList.js";
import createaddress from "../controllers/address/createAddress.js";
import addresssingle from "../controllers/address/addressSingle.js";
import deleteaddress from "../controllers/address/deleteAddress.js";
import updateaddress from "../controllers/address/updateAddress.js";

const router = express.Router()
const upload = multer();

router.get('/', authenticateToken, addresslist)
// userid route is now redundant as main route filters by user
router.get('/:id', authenticateToken, addresssingle)
router.delete('/:id', authenticateToken, deleteaddress)
router.post('/', authenticateToken, upload.none(), createaddress)
router.patch('/:id', authenticateToken, upload.none(), updateaddress)


export default router;
