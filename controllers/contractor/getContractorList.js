import Contractor from "../../models/contractor.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getContractorList = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            city,
            categoryId,
            providerType,
            status = 'approved',
            isFeatured,
            isVerified,
            isTopRated
        } = req.query;

        const query = {};

        // Filtering
        // if (status) query.status = status; // Temporarily disabled status filter
        query.visibility = 'public'; // Only show public profiles
        if (city) query["location.city"] = new RegExp(city, "i");
        if (categoryId) query.categoryId = categoryId;
        if (providerType) query.providerType = providerType;
        
        if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
        if (isVerified !== undefined) query.isVerified = isVerified === 'true';
        if (isTopRated !== undefined) query.isTopRated = isTopRated === 'true';

        // Generic search
        if (search) {
            query.$or = [
                { businessName: new RegExp(search, "i") },
                { tagline: new RegExp(search, "i") },
                { overview: new RegExp(search, "i") },
                { "location.city": new RegExp(search, "i") }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Contractor.countDocuments(query);
        
        const data = await Contractor.find(query)
            .populate("userId", "name profile")
            .sort({ isFeatured: -1, isTopRated: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        return success(res, {
            data,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }, 200);

    } catch (err) {
        console.error("getContractorList error:", err);
        return fail(res, err, 500);
    }
};

export default getContractorList;
