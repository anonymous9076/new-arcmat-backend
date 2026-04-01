import Brand from "../../models/brand.js";
import Product from "../../models/product.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import mongoose from 'mongoose';

const getBrandList = async (req, res) => {
    try {
        const {
            type,
            name,
            isActive,
            userId,
            startDate,
            endDate,
            page = 1,
            limit = 10,
            search,
            showOnHomepage
        } = req.query;

        if (type === "distinct") {
            // Gets distinct brand names currently assigned to products
            const brands = await Product.distinct("brand");
            return success(res, brands, 200);
        }

        const query = {};

        // Filtering
        if (name) query.name = new RegExp(name, "i");
        if (isActive !== undefined && isActive !== "") {
            if (isActive === "true") query.isActive = 1;
            else if (isActive === "false") query.isActive = 0;
            else {
                const parsedStatus = parseInt(isActive);
                if (!isNaN(parsedStatus)) query.isActive = parsedStatus;
            }
        }
        if (userId) query.userId = userId;

        if (showOnHomepage !== undefined && showOnHomepage !== "") {
            query.showOnHomepage = parseInt(showOnHomepage);
        }

        // Date range filtering
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Generic search
        if (search) {
            query.$or = [
                { name: new RegExp(search, "i") },
                { description: new RegExp(search, "i") },
                { website: new RegExp(search, "i") }
            ];
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const processBrand = async (brand) => {
            const isValidId = (id) => id && mongoose.Types.ObjectId.isValid(id);

            // Populate addresses if needed
            if (isValidId(brand.shippingAddress)) {
                brand.shippingAddress = await mongoose.model('address').findById(brand.shippingAddress).lean();
            }
            if (isValidId(brand.billingAddress)) {
                brand.billingAddress = await mongoose.model('address').findById(brand.billingAddress).lean();
            }

            // Calculations
            const [totalCount, newCount, updatedCount] = await Promise.all([
                Product.countDocuments({ brand: brand._id }),
                Product.countDocuments({
                    brand: brand._id,
                    createdAt: { $gte: sevenDaysAgo }
                }),
                Product.countDocuments({
                    brand: brand._id,
                    updatedAt: { $gte: sevenDaysAgo },
                    createdAt: { $lt: sevenDaysAgo }
                })
            ]);

            brand.productCount = totalCount;
            brand.newCount = newCount;
            brand.updatedCount = updatedCount;

            return brand;
        };

        if (type === "frontend") {
            query.isActive = 1;
            const brands = await Brand.find(query)
                .populate("userId", "name")
                .lean();

            const populatedData = await Promise.all(brands.map(processBrand));
            return success(res, populatedData);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Brand.countDocuments(query);
        const rawData = await Brand.find(query)
            .populate("userId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const data = await Promise.all(rawData.map(processBrand));

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
        console.error("getBrandList error:", err);
        return fail(res, err, 500);
    }
};

export default getBrandList;
