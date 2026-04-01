import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import connectdb from "./db/connection.js";
import infoRouter from "./routes/infoRouter.js";
import userRouter from "./routes/userRouter.js";
import categoryRouter from "./routes/categoryRouter.js";
import attributeRouter from "./routes/attributeRouter.js";
import productRouter from "./routes/productRouter.js";
import cartRouter from "./routes/cartRouter.js";
import bannerRouter from "./routes/bannerRouter.js";
import variantRouter from "./routes/variantRouter.js";
import wishlistRouter from "./routes/wishlistRouter.js";
import carouselListRouter from "./routes/carouselListRouter.js";
import brandRouter from "./routes/brandRouter.js";
import addressRouter from "./routes/addressRouter.js";
import orderRouter from "./routes/orderRouter.js";
import retailerRouter from "./routes/retailerRouter.js";
import projectRouter from "./routes/projectRouter.js";
import moodboardRouter from "./routes/moodboardRouter.js";
import estimatedCostRouter from "./routes/estimatedCostRouter.js";
import materialHistoryRouter from "./routes/materialHistoryRouter.js";
import discussionRouter from "./routes/discussionRouter.js";
import sampleRequestRouter from "./routes/sampleRequestRouter.js";
import retailerRequestRouter from "./routes/retailerRequestRouter.js";
import helpRouter from "./routes/helpRouter.js";
import bentoRouter from "./routes/bentoRouter.js";
import analyticsRouter from "./routes/analyticsRouter.js";
import ratingRouter from "./routes/ratingRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import inspirationGalleryRouter from "./routes/inspirationGalleryRouter.js";
import projectTemplateRouter from "./routes/projectTemplateRouter.js";




import normalizeResponse from "./middlewares/normalizeResponse.js";
import errorHandler from "./middlewares/errorHandler.js";

// Models
import "./models/contactus.js";
import "./models/category.js";
import "./models/attribute.js";
import "./models/product.js";
import "./models/productVariant.js";
import "./models/user.js";
import "./models/wishlist.js";
import "./models/brand.js";
import "./models/address.js";
import "./models/order.js";
import "./models/retailerproduct.js";
import "./models/project.js";
import "./models/moodboard.js";
import "./models/estimatedCost.js";
import "./models/materialHistory.js";
import "./models/discussion.js";
import "./models/sampleRequest.js";
import "./models/retailerRequest.js";
import "./models/helpQueryModel.js";
import "./models/retailerBrandSelection.js";
import "./models/rating.js";
import "./models/notification.js";
import "./models/projectTemplate.js";
import "./models/moodboardTemplate.js";
import "./models/estimatedCostTemplate.js";
import "./models/productlead.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
mongoose.set("strictQuery", false);

const app = express();

// Middle-wares
app.use(cors({
  origin: ["https://arcmat-frontend-one.vercel.app", "http://localhost:3000", "http://localhost:5173", "https://arcmat.in", "https://www.arcmat.in"],
  credentials: true
}));
app.use(express.json({ limit: "500mb" }));

app.use(express.urlencoded({ limit: "500mb", extended: true }));

app.use(
  "/api/public",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "public"))
);

app.use(normalizeResponse);

// Routes
app.use("/api", infoRouter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/attribute", attributeRouter);
app.use("/api/banner", bannerRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/variant", variantRouter);
app.use("/api/list", carouselListRouter);
app.use("/api/brand", brandRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/retailer", retailerRouter);
app.use("/api/project", projectRouter);
app.use("/api/moodboard", moodboardRouter);
app.use("/api/estimated-cost", estimatedCostRouter);
app.use("/api/material-history", materialHistoryRouter);
app.use("/api/discussion", discussionRouter);
app.use("/api/sample-request", sampleRequestRouter);
app.use("/api/retailer-request", retailerRequestRouter);
app.use("/api/help", helpRouter);
app.use("/api/bento", bentoRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/rating", ratingRouter);
app.use("/api/notification", notificationRouter);
app.use("/api/inspiration-gallery", inspirationGalleryRouter);
app.use("/api/project-templates", projectTemplateRouter);



// Error handler
app.use(errorHandler);

app.use('/', (req, res) => {
  res.send("Arcmat Backend")
})

// DB connection cache (IMPORTANT for Vercel)
let isConnected = false;

async function initApp() {
  try {
    if (!isConnected) {
      await connectdb();
      isConnected = true;
      console.log("Initialization: Database connected successfully");
    }
  } catch (error) {
    console.error("Initialization error:", error);
    throw error;
  }
}

// Vercel handler
export default async function (req, res) {
  try {
    await initApp();
    return app(req, res);
  } catch (err) {
    console.error("Vercel Invocation Error:", err);
    res.status(500).json({ status: "failed", message: "Internal server error during function invocation" });
  }
}

// Local server support
if (process.env.VERCEL !== "1") {
  const port = process.env.PORT || 8000;

  initApp().then(() => {
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${port} is already in use.`);
        console.error(`To fix this, run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });
  });
}
