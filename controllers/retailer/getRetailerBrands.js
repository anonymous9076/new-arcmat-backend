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

        const uniqueBrandsMap = new Map();
        brands.forEach(brand => {
            const brandId = (brand._id || brand).toString();
            if (!uniqueBrandsMap.has(brandId)) {
                uniqueBrandsMap.set(brandId, brand);
            }
        });

        // Resolve productsCount for each unique brand
        const Product = (await import('../../models/product.js')).default;
        const uniqueBrands = [];
        
        for (const brand of uniqueBrandsMap.values()) {
            const productCount = await Product.countDocuments({ brand: brand._id });
            uniqueBrands.push({
                ...brand,
                productsCount: productCount
            });
        }

        return success(res, uniqueBrands, 200);

    } catch (error) {
        console.error('getRetailerBrands error:', error);
        return fail(res, error, 500);
    }
};

export default getRetailerBrands;
