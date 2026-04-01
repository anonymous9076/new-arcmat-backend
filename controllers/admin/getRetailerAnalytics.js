import mongoose from 'mongoose';
import RetailerBrandSelection from '../../models/retailerBrandSelection.js';
import Brand from '../../models/brand.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get Retailer Selection Analytics for Admin
 * GET /admin/analytics/retailer-selection
 * Query filters: brandId, city, state, startDate, endDate
 */
const getRetailerAnalytics = async (req, res) => {
    try {
        const { brandId, city, state, startDate, endDate } = req.query;

        // Build match stage for MongoDB aggregation
        const match = {};
        if (brandId && brandId !== 'undefined' && brandId !== '') {
            match.brandId = new mongoose.Types.ObjectId(brandId);
        }
        if (city && city.trim() !== '') {
            match.city = { $regex: new RegExp(city.trim(), 'i') };
        }
        if (state && state.trim() !== '') {
            match.state = { $regex: new RegExp(state.trim(), 'i') };
        }

        if (startDate || endDate) {
            match.selectedAt = {};
            if (startDate && startDate !== '') match.selectedAt.$gte = new Date(startDate);
            if (endDate && endDate !== '') match.selectedAt.$lte = new Date(endDate);
            // If the date filters are added but empty, remove the field
            if (Object.keys(match.selectedAt).length === 0) {
                delete match.selectedAt;
            }
        }


        // 1. Brand-wise Retailer Count
        const brandWiseStats = await RetailerBrandSelection.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$brandId',
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            { $unwind: '$brandInfo' },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    brandName: '$brandInfo.name'
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 2. Location-wise Brand Demand (top cities/states for each brand)
        const locationWiseStats = await RetailerBrandSelection.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { brandId: '$brandId', city: '$city' },
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'brands',
                    localField: '_id.brandId',
                    foreignField: '_id',
                    as: 'brandInfo'
                }
            },
            { $unwind: '$brandInfo' },
            {
                $project: {
                    brandId: '$_id.brandId',
                    brandName: '$brandInfo.name',
                    city: '$_id.city',
                    count: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 3. Overall Location stats (Top cities with most retailer activity)
        const topCities = await RetailerBrandSelection.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return success(res, {
            brandWiseStats,
            locationWiseStats,
            topCities
        }, 200);

    } catch (error) {
        console.error('getRetailerAnalytics error:', error);
        return fail(res, error, 500);
    }
};

export default getRetailerAnalytics;
