import Usertable from '../../models/user.js';
import Address from '../../models/address.js';
import RetailerBrandSelection from '../../models/retailerBrandSelection.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Update Retailer's authorized brands list
 * PATCH /retailer/brands
 * Body: { brandId: "...", action: "add" | "remove" }
 */
const updateRetailerBrands = async (req, res) => {
    try {
        const { brandId, action } = req.body;
        let retailerId = req.user.id;

        // If admin, they can specify a retailerId in the query or body
        if (req.user.role === 'admin' && (req.query.retailerId || req.body.retailerId)) {
            retailerId = req.query.retailerId || req.body.retailerId;
        }

        if (!brandId || !action) {
            return fail(res, new Error('brandId and action (add/remove) are required'), 400);
        }

        // Restriction: Retailer must have at least one address to add a brand
        if (action === 'add') {
            const addressCount = await Address.countDocuments({ userId: retailerId });
            if (addressCount === 0) {
                return fail(res, new Error('Please register at least one address before adding brand partnerships'), 400);
            }
        }

        const update = action === 'add'
            ? { $addToSet: { selectedBrands: brandId } }
            : { $pull: { selectedBrands: brandId } };

        const updatedUser = await Usertable.findByIdAndUpdate(
            retailerId,
            update,
            { new: true }
        ).select('selectedBrands name role');

        if (!updatedUser) {
            return fail(res, new Error('Retailer not found'), 404);
        }

        // Analytics: Track selection if action is 'add'
        if (action === 'add') {
            const defaultAddress = await Address.findOne({ userId: retailerId, defaultaddress: 1 });
            await RetailerBrandSelection.create({
                retailerId,
                brandId,
                city: defaultAddress?.city || 'Unknown',
                state: defaultAddress?.state || 'Unknown',
                selectedAt: new Date()
            });
        }

        return success(res, updatedUser, 200);

    } catch (error) {
        console.error('updateRetailerBrands error:', error);
        return fail(res, error, 500);
    }
};

export default updateRetailerBrands;
