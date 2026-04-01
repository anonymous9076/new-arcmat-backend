import express from "express";
import contactus from "../controllers/info/contactUs.js";
import upload from "../middlewares/imageUploader.js";
import webinfo from "../controllers/info/webInfo.js";
import getwebinfo from "../controllers/info/getWebInfo.js";
import editwebinfo from "../controllers/info/editWebInfo.js";
import contactlist from "../controllers/info/contactList.js";


const router = express.Router()


router.get('/contactus', contactlist);
router.post('/contactus', upload.none(), contactus);
router.post('/websiteinfo', upload.info.fields([
  { name: 'logo', maxCount: 1 },
]), webinfo);
router.patch('/websiteinfo', upload.info.fields([
  { name: 'logo', maxCount: 1 },
]), editwebinfo);
router.get('/websiteinfo', getwebinfo);

export default router;
