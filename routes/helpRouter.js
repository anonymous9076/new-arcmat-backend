import express from "express";
import createQuery from "../controllers/help/createHelp.js";
import getQueries from "../controllers/help/getHelp.js";
import updateQueryStatus from "../controllers/help/updateHelp.js";
import deleteQuery from "../controllers/help/deleteHelp.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

// User/Admin: Create a new support query
router.post("/", authenticateToken, createQuery);

// User: Get own queries | Admin: Get all queries
router.get("/", authenticateToken, getQueries);

// Admin Only: Update query status
router.patch("/:queryId/status", authenticateToken(['admin']), updateQueryStatus);

// Admin Only: Delete query
router.delete("/:queryId", authenticateToken(['admin']), deleteQuery);

export default router;
