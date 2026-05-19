import mongoose from "mongoose";
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
        console.log("getContractorList - Received Query Params:", req.query);

        // Filtering
        // if (status) query.status = status; // Temporarily disabled status filter
        query.visibility = { $ne: 'private' }; // Show public and default/missing visibility profiles, exclude private

        if (city) {
            // Include contractors for the specific city AND contractors with "All India" national presence
            query["location.city"] = {
                $in: [new RegExp(city, "i"), new RegExp("^all india$", "i")]
            };
        }
        if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
        if (providerType && providerType !== 'all') query.providerType = providerType;

        if (isFeatured !== undefined && isFeatured !== 'all') query.isFeatured = isFeatured === 'true';
        if (isVerified !== undefined && isVerified !== 'all') query.isVerified = isVerified === 'true';
        if (isTopRated !== undefined && isTopRated !== 'all') query.isTopRated = isTopRated === 'true';

        // Generic search
        if (search) {
            query.$or = [
                { businessName: new RegExp(search, "i") },
                { tagline: new RegExp(search, "i") },
                { overview: new RegExp(search, "i") },
                { "location.city": new RegExp(search, "i") }
            ];
        }

        console.log("getContractorList - Constructed Mongo Query:", JSON.stringify(query, null, 2));

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Contractor.countDocuments(query);
        console.log(`getContractorList - Total documents matching query: ${total}`);

        const data = await Contractor.find(query)
            .populate("userId", "name profile")
            .sort({ isFeatured: -1, isTopRated: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Manually populate categoryId if it's a valid ObjectId
        for (let item of data) {
            if (item.categoryId && mongoose.Types.ObjectId.isValid(item.categoryId)) {
                const category = await mongoose.model('Category').findById(item.categoryId).select('name').lean();
                if (category) item.categoryId = category;
            }
        }

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
