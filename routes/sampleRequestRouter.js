import express from "express";
import {
    createSampleRequest,
    getSampleRequests,
    getMySampleRequests,
    updateSampleStatus,
    deleteSampleRequest,
    updateSampleRequest,
    getRetailerSampleRequests,
} from "../controllers/sampleRequest/sampleRequest.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Architect: get all their sample requests across projects
router.get("/mine", authenticateToken(['architect', 'professional', 'customer']), getMySampleRequests);

// Create a sample request for a project
router.post("/:projectId", authenticateToken(['architect', 'professional']), createSampleRequest);

// Get all sample requests for a project
router.get("/:projectId", authenticateToken(['architect', 'professional', 'customer', 'admin']), getSampleRequests);

// Retailer: get their assigned sample requests
router.get("/retailer/mine", authenticateToken(['retailer']), getRetailerSampleRequests);

// Admin/Retailer updates status
router.patch("/:requestId/status", authenticateToken(['admin', 'retailer']), updateSampleStatus);

// Architect: delete their own request
router.delete("/active/:requestId", authenticateToken(['architect', 'professional']), deleteSampleRequest);

// Architect: edit their own request
router.patch("/active/:requestId", authenticateToken(['architect', 'professional']), updateSampleRequest);

export default router;
