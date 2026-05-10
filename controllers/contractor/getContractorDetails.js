import mongoose from "mongoose";
import Contractor from "../../models/contractor.js";
import ContractorPortfolioItem from "../../models/contractorPortfolioItem.js";
import { success, fail } from "../../middlewares/responseHandler.js";

const getContractorDetails = async (req, res) => {
    try {
        const { slug } = req.params;

        const contractor = await Contractor.findOne({ slug })
            .populate("userId", "name profile")
            .lean();

        if (!contractor) {
            return fail(res, "Contractor not found", 404);
        }

        // Manually populate categoryId if it's a valid ObjectId
        if (contractor.categoryId && mongoose.Types.ObjectId.isValid(contractor.categoryId)) {
            const category = await mongoose.model('Category').findById(contractor.categoryId).select('name').lean();
            if (category) contractor.categoryId = category;
        }

        // Increment views
        await Contractor.findByIdAndUpdate(contractor._id, { $inc: { views: 1 } });

        // Fetch portfolio items
        const portfolio = await ContractorPortfolioItem.find({ contractorId: contractor._id })
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();

        contractor.portfolio = portfolio;

        return success(res, contractor, 200);

    } catch (err) {
        console.error("getContractorDetails error:", err);
        return fail(res, err, 500);
    }
};

export default getContractorDetails;
