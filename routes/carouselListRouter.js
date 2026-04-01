import express from "express";
import newarrival from "../controllers/carouselItem/newArrivalList.js";
import bestseller from "../controllers/carouselItem/bestSellerList.js";
import featureitem from "../controllers/carouselItem/featureItemList.js";

const router = express.Router()

router.get('/newarrival', newarrival)
router.get('/bestseller', bestseller)
router.get('/featureitem', featureitem)

export default router;