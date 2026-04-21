import express from "express";
import multer from "multer";
import createattribute from "../controllers/attribute/createAttribute.js";
import attributelist from "../controllers/attribute/attributeList.js";
import deleteattribute from "../controllers/attribute/deleteAttribute.js";
import attribute_single from "../controllers/attribute/attributeSingle.js";
import updateattribute from "../controllers/attribute/updateAttribute.js";
import attribute_listing_by_categoryid from "../controllers/attribute/attributeListingByCategoryId.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();
const upload = multer();
router.get("/", attributelist);
router.patch('/:id', authenticateToken(['admin']), upload.none(), updateattribute)
router.get('/:id', attribute_single)
router.get('/listbycategoryid/:id', attribute_listing_by_categoryid)
router.post("/", authenticateToken(['admin', 'brand']), upload.none(), createattribute);
router.delete("/:id", authenticateToken(['admin']), deleteattribute);

export default router;
