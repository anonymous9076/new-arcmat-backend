import express from "express";
import { submitRatings, getUserRatings } from "../controllers/rating/ratingController.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

// Architects can submit ratings
router.post("/submit", authenticateToken(['architect', 'customer', 'professional', 'admin']), submitRatings);

// Public/Authenticated view of user ratings
router.get("/user/:userId", authenticateToken(), getUserRatings);

export default router;
