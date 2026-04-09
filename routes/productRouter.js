import express from "express";
import createproduct from "../controllers/product/createProduct.js";
import upload from "../middlewares/imageUploader.js";
import singleProduct from "../controllers/product/singleProduct.js";
import updateproduct from "../controllers/product/updateProduct.js";
import deleteproduct from "../controllers/product/deleteProduct.js";
import bulkimport from "../controllers/product/bulkImport.js";
import bulkImageUpload from "../controllers/product/bulkImageUpload.js";
import bulkActivateProducts from "../controllers/product/bulkActivateProducts.js";
import bulkDeleteProducts from "../controllers/product/bulkDeleteProducts.js";
import bulkApproveProducts from "../controllers/product/bulkApproveProducts.js";
import multer from "multer";
import frontendList from "../controllers/product/frontendList.js";
import exportProductData from "../controllers/product/exportProductData.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import authenticateToken from "../middlewares/verifyToken.js";
import checkuser from "../middlewares/checkUser.js";
import submitProductLead from "../controllers/product/submitProductLead.js";
import getProductLeads from "../controllers/product/getProductLeads.js";
import updateProductLeadStatus from "../controllers/product/updateProductLeadStatus.js";
import clearBulkSession from "../controllers/product/clearBulkSession.js";

import { excelUploader } from "../middlewares/imageUploader.js";

const router = express.Router();
const memoryUpload = multer({ storage: multer.memoryStorage() });

router.get("/", frontendList);
router.get("/export-data", authenticateToken(['admin', 'brand']), exportProductData);
router.get("/:id", validateObjectId, checkuser, singleProduct);
router.post("/", authenticateToken(['brand']), upload.productTemp.array("product_images", 20), createproduct);
router.patch("/:id", validateObjectId, authenticateToken(['admin', 'brand']), upload.productTemp.array("product_images", 20), updateproduct);
router.delete("/:id", validateObjectId, authenticateToken(['admin', 'brand']), deleteproduct);
router.post("/bulk-import", authenticateToken(['brand']), excelUploader.single("file"), bulkimport);
router.post("/bulk-image-upload", authenticateToken(['brand']), memoryUpload.single("zipFile"), bulkImageUpload);
router.post("/bulk-activate", authenticateToken(['admin']), bulkActivateProducts);
router.post("/bulk-delete", authenticateToken(['admin', 'brand', 'retailer']), bulkDeleteProducts);
router.post("/bulk-approve", authenticateToken(['admin']), bulkApproveProducts);
router.delete("/bulk-session", authenticateToken(['admin', 'brand']), clearBulkSession);

// Product Leads
router.post("/submit-lead", checkuser, submitProductLead);
router.get("/leads/all", authenticateToken(['admin']), getProductLeads);
router.patch("/leads/:id/status", authenticateToken(['admin']), updateProductLeadStatus);

export default router;
