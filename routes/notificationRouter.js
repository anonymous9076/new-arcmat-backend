import express from "express";
import { createNotification, getMyNotifications, markAsRead, handleAction } from "../controllers/notification/notificationController.js";
import { getSidebarCounts } from "../controllers/notification/getSidebarCounts.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/", authenticateToken, createNotification);
router.get("/", authenticateToken, getMyNotifications);
router.get("/counts", authenticateToken, getSidebarCounts);
router.patch("/:id/read", authenticateToken, markAsRead);
router.patch("/:id/action", authenticateToken, handleAction);

export default router;
