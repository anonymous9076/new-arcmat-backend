import express from "express";
import createProject from "../controllers/project/createProject.js";
import updateProject from "../controllers/project/updateProject.js";
import deleteProject from "../controllers/project/deleteProject.js";
import getProjects from "../controllers/project/getProjects.js";
import { inviteClient } from "../controllers/project/inviteClient.js";
import { acceptInvite } from "../controllers/project/acceptInvite.js";
import { completeProject } from "../controllers/project/completeProject.js";
import { markNotificationsRead } from "../controllers/project/markNotificationsRead.js";
import { markRetailerChatRead } from "../controllers/project/markRetailerChatRead.js";
import { getProductNotifications } from "../controllers/project/getProductNotifications.js";
import authenticateToken from "../middlewares/verifyToken.js";
import upload from "../middlewares/imageUploader.js";
import { uploadRender, deleteRender } from "../controllers/project/uploadRender.js";

const router = express.Router();

// Public route for accepting invitations (placed before general auth)
router.patch("/accept-invite", acceptInvite);

router.post("/", authenticateToken(['architect']), createProject);
router.post("/:projectId/invite-client", authenticateToken(['architect']), inviteClient);
router.get("/", authenticateToken(["customer", "architect", "retailer", "admin", "brand"]), getProjects);
router.get("/:id", authenticateToken(["customer", "architect", "retailer", "admin", "brand"]), getProjects);
router.post("/:id/complete", authenticateToken(['architect', 'admin']), completeProject);
router.get("/:id/space/:spaceId/notifications", authenticateToken(["customer", "professional", "architect", "admin"]), getProductNotifications);
router.post("/mark-retailer-read", authenticateToken(["architect", "retailer", "admin", "professional"]), markRetailerChatRead);
router.post("/:id/mark-read", authenticateToken(["customer", "professional", "architect", "retailer", "admin"]), markNotificationsRead);
router.patch("/:id", authenticateToken(['architect']), upload.fields([{ name: 'coverImage', maxCount: 1 }]), updateProject);
router.delete("/:id", authenticateToken(['architect']), deleteProject);

router.post("/:id/renders", authenticateToken(['architect', 'admin']), upload.single('image'), uploadRender);
router.delete("/:id/renders/:renderId", authenticateToken(['architect', 'admin']), deleteRender);

export default router;
