import express from "express";
import upload from "../middlewares/imageUploader.js";
import createvariant from "../controllers/productVariant/createVariant.js";
import updateproductvariant from "../controllers/productVariant/updateProductVariant.js";
import singleproductvariant from "../controllers/productVariant/singleProductVariant.js";
import deleteproductvariant from "../controllers/productVariant/deleteProductVariant.js";
import productvariantlist from "../controllers/productVariant/productVariantList.js";
import frontend_singleproductvariant from "../controllers/productVariant/frontendSingleProductVariant.js";
import frontend_variant_list from "../controllers/productVariant/frontendVariantList.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post(
  "/", authenticateToken(['brand']),
  upload.variantTemp.array("variant_images", 5),
  createvariant
);
router.patch(
  "/:id", authenticateToken(['admin', 'brand']),
  upload.variantTemp.array("variant_images", 5),
  updateproductvariant
);
router.get("/", frontend_variant_list);
router.get("/id/:id", productvariantlist);
router.get("/:id", singleproductvariant);
router.get('/filter/:parentid', frontend_singleproductvariant)
router.delete("/:id", authenticateToken(['admin', 'brand']), deleteproductvariant);

export default router;
