import mongoose from 'mongoose';
import RetailerBrandSelection from '../../models/retailerBrandSelection.js';
import Usertable from '../../models/user.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get Retailer Analytics for a specific Brand
 * GET /analytics/brand/retailer-selection
 * Query filters: city, state, startDate, endDate
 */
const getBrandRetailerAnalytics = async (req, res) => {
    try {
        let brandId = req.query.brandId;

        if (req.user.role === 'brand' || req.user.role === 'vendor') {
            const rawId = req.user.selectedBrands && req.user.selectedBrands[0];
            brandId = (rawId?._id || rawId?.id || rawId);
        }

        if (!brandId) {
            return fail(res, 'Brand ID is required', 400);
        }

        const { city, state, startDate, endDate } = req.query;

        // Build match stage for MongoDB aggregation
        const match = { brandId: new mongoose.Types.ObjectId(brandId) };

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
            if (Object.keys(match.selectedAt).length === 0) {
                delete match.selectedAt;
            }
        }

        // 1. Retailer List with City/State
        const retailers = await RetailerBrandSelection.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'usertables',
                    localField: 'retailerId',
                    foreignField: '_id',
                    as: 'retailerInfo'
                }
            },
            { $unwind: '$retailerInfo' },
            {
                $project: {
                    _id: 1,
                    retailerId: 1,
                    retailerName: '$retailerInfo.name',
                    retailerEmail: '$retailerInfo.email',
                    city: 1,
                    state: 1,
                    selectedAt: 1
                }
            },
            { $sort: { selectedAt: -1 } }
        ]);

        // 2. Regional Stats (Count per City)
        const regionalStats = await RetailerBrandSelection.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 3. Architects connected to these retailers (based on shared cities)
        const retailerCities = [...new Set(retailers.map(r => r.city))];

        const connectedArchitects = await Usertable.aggregate([
            {
                $match: {
                    role: 'architect',
                    'address.city': { $in: retailerCities }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    city: '$address.city',
                    mobile: 1
                }
            }
        ]);

        // Map architects to retailers via city
        const retailersWithArchitects = retailers.map(retailer => ({
            ...retailer,
            architects: connectedArchitects.filter(arch => arch.city === retailer.city)
        }));

        return success(res, {
            retailers: retailersWithArchitects,
            regionalStats,
            totalRetailers: retailers.length,
            totalArchitects: connectedArchitects.length
        }, 200);

    } catch (error) {
        console.error('getBrandRetailerAnalytics error:', error);
        return fail(res, error, 500);
    }
};

export default getBrandRetailerAnalytics;
