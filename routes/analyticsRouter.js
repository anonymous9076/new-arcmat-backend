import express from 'express';
import authenticateToken from '../middlewares/verifyToken.js';
import getRetailerAnalytics from '../controllers/admin/getRetailerAnalytics.js';
import getBrandRetailerAnalytics from '../controllers/brand/getBrandRetailerAnalytics.js';
import getBrandProductAnalytics from '../controllers/brand/getBrandProductAnalytics.js';
import getBrandProfessionalInsights from '../controllers/brand/getBrandProfessionalInsights.js';

const router = express.Router();

// Brand & Admin routes for analytics
router.get('/retailer-selection', authenticateToken(['admin']), getRetailerAnalytics);
router.get('/brand/retailer-selection', authenticateToken(['brand', 'admin', 'vendor']), getBrandRetailerAnalytics);
router.get('/brand/product-analytics', authenticateToken(['brand', 'admin', 'vendor']), getBrandProductAnalytics);
router.get('/brand/professional-insights', authenticateToken(['brand', 'admin', 'vendor']), getBrandProfessionalInsights);

export default router;
