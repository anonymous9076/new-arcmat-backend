import express from "express";
import { createestimatedcost } from "../controllers/estimatedCost/createEstimatedCost.js";
import updateestimatedcost from "../controllers/estimatedCost/updateEstimatedCost.js";
import deleteestimatedcost from "../controllers/estimatedCost/deleteEstimatedCost.js";
import authenticateToken from "../middlewares/verifyToken.js";
import validateObjectId from "../middlewares/validateObjectId.js";

const router = express.Router();

// Apply authentication
router.use(authenticateToken(['architect', 'admin']));

router.post("/", createestimatedcost);
router.patch("/:id", validateObjectId, updateestimatedcost);
router.delete("/:id", validateObjectId, deleteestimatedcost);

export default router;
