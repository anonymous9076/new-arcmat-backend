import express from "express";
import getContractorList from "../controllers/contractor/getContractorList.js";
import getContractorDetails from "../controllers/contractor/getContractorDetails.js";
import createContractorProfile from "../controllers/contractor/createContractorProfile.js";
import updateContractorProfile from "../controllers/contractor/updateContractorProfile.js";
import getMyProfile from "../controllers/contractor/getMyProfile.js";
import createContractorLead from "../controllers/contractor/createContractorLead.js";
import uploadContractorImage from "../controllers/contractor/uploadContractorImage.js";
import createPortfolioItem from "../controllers/contractor/createPortfolioItem.js";
import updatePortfolioItem from "../controllers/contractor/updatePortfolioItem.js";
import deletePortfolioItem from "../controllers/contractor/deletePortfolioItem.js";
import getPortfolioItemDetails from "../controllers/contractor/getPortfolioItemDetails.js";
import upload from "../middlewares/imageUploader.js";

const router = express.Router();

// Public routes
router.get("/", getContractorList);
router.get("/:slug", getContractorDetails);
router.get("/portfolio/:itemId", getPortfolioItemDetails);
router.post("/leads", createContractorLead);

// Protected/Private routes
router.get("/my-profile/:userId", getMyProfile);
router.post("/profile", createContractorProfile);
router.patch("/profile/:id", updateContractorProfile);
router.post("/upload", upload.single("image"), uploadContractorImage);
router.post("/:contractorId/portfolio", upload.array("files", 12), createPortfolioItem);
router.patch("/portfolio/:itemId", upload.array("files", 12), updatePortfolioItem);
router.delete("/portfolio/:itemId", deletePortfolioItem);

export default router;
