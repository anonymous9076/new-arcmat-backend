import express from "express";
import createmoodboard from "../controllers/moodboard/createMoodboard.js";
import duplicatemoodboard from "../controllers/moodboard/duplicateMoodboard.js";
import getmoodboardbyproject from "../controllers/moodboard/getMoodboardByProject.js";
import getmoodboardlist from "../controllers/moodboard/getMoodboardList.js";
import getmoodboardbyid from "../controllers/moodboard/getMoodboardById.js";
import updatemoodboard from "../controllers/moodboard/updateMoodboard.js";
import deletemoodboard from "../controllers/moodboard/deleteMoodboard.js";
import getallarchitectboards from "../controllers/moodboard/getAllArchitectBoards.js";
import authenticateToken from "../middlewares/verifyToken.js";
import validateObjectId from "../middlewares/validateObjectId.js";
import upload from "../middlewares/imageUploader.js";

const router = express.Router();

router.post("/", authenticateToken(['architect']), createmoodboard);
router.post("/duplicate/:id", authenticateToken(['architect']), validateObjectId, duplicatemoodboard);
router.get("/list/all", authenticateToken(["customer", "professional", "architect", "retailer", "admin", "brand"]), getallarchitectboards);
router.get("/project/:projectId", authenticateToken(["customer", "professional", "architect", "retailer", "admin", "brand"]), validateObjectId, getmoodboardbyproject);
router.get("/list/:projectId", authenticateToken(["customer", "professional", "architect", "retailer", "admin", "brand"]), validateObjectId, getmoodboardlist);
router.get("/id/:id", authenticateToken(["customer", "professional", "architect", "retailer", "admin", "brand"]), validateObjectId, getmoodboardbyid);
router.patch("/:id", authenticateToken(['architect', 'customer', 'professional', 'admin']), validateObjectId, upload.fields([{ name: 'coverImage', maxCount: 1 }]), updatemoodboard);
router.delete("/:id", authenticateToken(['architect']), validateObjectId, deletemoodboard);

export default router;
