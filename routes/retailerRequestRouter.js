import express from "express";
import {
    createRetailerRequest,
    getMyRetailerRequests,
    getProjectRetailerRequests,
    updateRetailerRequest,
    getAllRetailerRequests,
    getRetailerAssignedRequests,
    retailerUpdateStatus,
} from "../controllers/retailerRequest/retailerRequest.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Architect gets all their retailer requests across projects
router.get("/mine", authenticateToken(['architect', 'professional']), getMyRetailerRequests);

// Admin gets ALL retailer requests
router.get("/all", authenticateToken(['admin']), getAllRetailerRequests);

// Retailer gets requests assigned to them
router.get("/assigned", authenticateToken(['retailer']), getRetailerAssignedRequests);

// Architect creates a retailer contact request
router.post("/:projectId", authenticateToken(['architect', 'professional']), createRetailerRequest);

// Get all retailer requests for a project
router.get("/:projectId", authenticateToken(['architect', 'professional', 'customer', 'admin']), getProjectRetailerRequests);

// Admin/Arcmat updates a request (confirm, share details)
router.patch("/:requestId", authenticateToken(['admin']), updateRetailerRequest);

// Retailer updates status (Processing, Confirmed, etc.)
router.patch("/:requestId/status", authenticateToken(['retailer']), retailerUpdateStatus);

export default router;
