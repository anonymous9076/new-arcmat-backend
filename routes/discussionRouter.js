import express from "express";
import {
    postComment,
    getComments,
    deleteComment,
} from "../controllers/discussion/discussion.js";
import authenticateToken from "../middlewares/verifyToken.js";
import upload from "../middlewares/imageUploader.js";

const router = express.Router();

// Get all comments for a project
router.get("/:projectId", authenticateToken(['architect', 'customer', 'professional', 'retailer', 'admin']), getComments);

// Post a new comment
router.post("/:projectId", authenticateToken(['architect', 'customer', 'professional', 'retailer', 'admin']), upload.array("attachments", 10), postComment);

// Delete a comment
router.delete("/comment/:commentId", authenticateToken(['architect', 'customer', 'professional', 'retailer', 'admin']), deleteComment);

export default router;
