import Usertable from '../../models/user.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get all brands associated with the authenticated retailer
 * GET /retailer/brands
 */
const getRetailerBrands = async (req, res) => {
    try {
        let retailerId = req.user.id;

        // If admin, allow specifying retailerId via query
        if (req.user.role === 'admin' && req.query.retailerId) {
            retailerId = req.query.retailerId;
        }

        const retailer = await Usertable.findById(retailerId)
            .select('selectedBrands')
            .populate({
                path: 'selectedBrands',
                select: 'name logo description status' // Adjust fields based on Brand model
            })
            .lean();

        if (!retailer) {
            return fail(res, new Error('Retailer not found'), 404);
        }

        const brands = (retailer.selectedBrands || []).filter(b => b !== null);

        const uniqueBrands = [];
        const seenIds = new Set();
        brands.forEach(brand => {
            const brandId = (brand._id || brand).toString();
            if (!seenIds.has(brandId)) {
                uniqueBrands.push(brand);
                seenIds.add(brandId);
            }
        });

        return success(res, uniqueBrands, 200);

    } catch (error) {
        console.error('getRetailerBrands error:', error);
        return fail(res, error, 500);
    }
};

export default getRetailerBrands;
