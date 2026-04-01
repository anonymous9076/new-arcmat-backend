import express from "express";
import upload from "../middlewares/imageUploader.js";
import createbanner from "../controllers/banner/createBanner.js";
import bannerlist from "../controllers/banner/bannerList.js";
import bannersingle from "../controllers/banner/bannerSingle.js";
import deletebanner from "../controllers/banner/deleteBanner.js";
import updatebanner from "../controllers/banner/updateBanner.js";

import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router()

router.post('/', authenticateToken(['admin']), upload.banner.fields([
  { name: 'banner', maxCount: 1 },
]), createbanner);
router.get('/', bannerlist);
router.get('/:id', bannersingle);
router.delete('/:id', authenticateToken(['admin']), deletebanner);
router.patch('/:id', authenticateToken(['admin']), upload.banner.fields([
  { name: 'banner', maxCount: 1 },
]), updatebanner);
export default router;
