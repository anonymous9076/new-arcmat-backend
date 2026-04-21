import express from "express";
import {
    addMaterialVersion,
    getMaterialHistory,
    getProjectMaterialHistory,
    approveMaterialVersion,
} from "../controllers/materialHistory/materialHistory.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Architect adds a new material version to a space
router.post("/:projectId/versions", authenticateToken(['architect']), addMaterialVersion);

// Get material history for a specific space
router.get("/:projectId/space/:spaceId", authenticateToken(['architect', 'customer', 'professional', 'admin']), getMaterialHistory);

// Get all material history for a project (all spaces)
router.get("/:projectId/all", authenticateToken(['architect', 'customer', 'professional', 'admin']), getProjectMaterialHistory);

// Client or architect approves / rejects a material version
router.patch("/version/:versionId/approve", authenticateToken(['architect', 'customer', 'professional', 'admin']), approveMaterialVersion);

export default router;
