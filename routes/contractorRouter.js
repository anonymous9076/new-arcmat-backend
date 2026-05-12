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
import getContractorLeads from "../controllers/contractor/getContractorLeads.js";
import getContractorStats from "../controllers/contractor/getContractorStats.js";
import getCategoryRequests from "../controllers/contractor/getCategoryRequests.js";
import getContractorDebug from "../controllers/contractor/getContractorDebug.js";
import upload from "../middlewares/imageUploader.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Router-level logging
router.use((req, res, next) => {
    console.log(`Contractor Router: ${req.method} ${req.url}`);
    next();
});

// ─── Specific named routes MUST come before any wildcard /:param routes ───

// Public - exact path routes
router.get("/", getContractorList);
router.get("/debug", getContractorDebug);
router.post("/leads", createContractorLead);

// Protected - exact/specific path routes
router.get("/my-profile/:userId", getMyProfile);
router.get("/stats/:userId", getContractorStats);
router.post("/profile", createContractorProfile);
router.patch("/profile/:id", updateContractorProfile);
router.post("/upload", upload.single("image"), uploadContractorImage);

// Portfolio routes (start with /portfolio/)
router.get("/portfolio/:itemId", getPortfolioItemDetails);
router.patch("/portfolio/:itemId", upload.array("files", 12), updatePortfolioItem);
router.delete("/portfolio/:itemId", deletePortfolioItem);

// Admin routes
router.get("/admin/category-requests", authenticateToken(['admin']), getCategoryRequests);
// Parameterized routes with sub-paths (e.g. /:contractorId/portfolio)
router.post("/:contractorId/portfolio", upload.array("files", 12), createPortfolioItem);
router.get("/:contractorId/leads", getContractorLeads);

// ─── Wildcard slug route MUST be last (catches everything not matched above) ───
router.get("/:slug", getContractorDetails);

export default router;
