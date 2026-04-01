import mongoose from 'mongoose';
import Product from '../../models/product.js';
import Wishlist from '../../models/wishlist.js';
import SampleRequest from '../../models/sampleRequest.js';
import RetailerRequest from '../../models/retailerRequest.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get Product Analytics for a specific Brand
 * GET /analytics/brand/product-analytics
 */
const getBrandProductAnalytics = async (req, res) => {
    try {
        let brandId = req.query.brandId;

        if (req.user.role === 'brand' || req.user.role === 'vendor') {
            const rawId = req.user.selectedBrands && req.user.selectedBrands[0];
            brandId = (rawId?._id || rawId?.id || rawId);
        }

        if (!brandId) {
            return fail(res, 'Brand ID is required', 400);
        }

        const brandObjectId = new mongoose.Types.ObjectId(brandId);

        // 1. Get all products for this brand to use for counts in other collections
        const brandProducts = await Product.find({ brand: brandObjectId }).select('_id views product_name').lean();
        const productIds = brandProducts.map(p => p._id);

        // 2. Total Product Views
        const totalViews = brandProducts.reduce((acc, curr) => acc + (curr.views || 0), 0);

        // 3. Shortlisted Products (Wishlist)
        const shortlistedCount = await Wishlist.countDocuments({
            product_id: { $in: productIds }
        });

        // 4. Sample Requests
        const sampleRequestsCount = await SampleRequest.countDocuments({
            materialId: { $in: productIds }
        });

        // 5. Vendor Contact Requests (Retailer Requests)
        const vendorContactRequestsCount = await RetailerRequest.countDocuments({
            materialId: { $in: productIds }
        });

        // 6. Most Viewed Products (Top 5)
        const topViewedProducts = await Product.find({ brand: brandObjectId })
            .sort({ views: -1 })
            .limit(5)
            .select('product_name views skucode product_images')
            .lean();

        // 7. Data for a "Most Shortlisted" or similar if needed, but the requirements just say "Most Viewed"

        return success(res, {
            stats: {
                totalProductViews: totalViews,
                shortlistedProducts: shortlistedCount,
                sampleRequests: sampleRequestsCount,
                vendorContactRequests: vendorContactRequestsCount
            },
            topViewedProducts,
            totalProducts: brandProducts.length
        }, 200);

    } catch (error) {
        console.error('getBrandProductAnalytics error:', error);
        return fail(res, error, 500);
    }
};

export default getBrandProductAnalytics;
