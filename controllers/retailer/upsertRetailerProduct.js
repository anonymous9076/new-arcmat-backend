import RetailerProduct from '../../models/retailerproduct.js';
import Product from '../../models/product.js';
import variant from '../../models/productVariant.js';
import Usertable from '../../models/user.js';
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Add or Update Retailer Product pricing and stock
 * POST /retailer/products
 * PATCH /retailer/products/:id
 */
const upsertRetailerProduct = async (req, res) => {
    try {
        const { productId, variantId, mrp_price, selling_price, stock, isActive } = req.body;
        let retailerId = req.user.id;

        // If admin, allow specifying retailerId via body
        if (req.user.role === 'admin' && req.body.retailerId) {
            retailerId = req.body.retailerId;
        }
        const id = req.params.id; // Optional: for PATCH
        console.log(req.body, 'dsf')
        // 1. Validation
        if (!productId || !variantId || mrp_price === undefined || selling_price === undefined) {
            return fail(res, new Error('Missing required fields: productId, variantId, mrp_price, selling_price'), 400);
        }

        // if stock is empty then do nothing
        if (stock === undefined || stock === null || stock === '') {
            return success(res, { message: 'No changes made (stock is empty)' }, 200);
        }

        // 2. Check Product existence and authorized brand
        const productDoc = await Product.findById(productId).lean();
        if (!productDoc) {
            return fail(res, new Error('Product not found'), 404);
        }

        // Verify if the retailer is authorized to deal with this brand
        const retailer = await Usertable.findById(retailerId).select('selectedBrands').lean();
        if (!retailer || !retailer.selectedBrands || !retailer.selectedBrands.some(b => b.toString() === productDoc.brand.toString())) {
            return fail(res, new Error('You are not authorized to deal with this brand. Please add the brand to your reselling list first.'), 403);
        }

        // 3. Check Variant existence and available stock
        const variantDoc = await variant.findOne({ _id: variantId, productId });
        if (!variantDoc) {
            return fail(res, new Error('Variant not found for this product'), 404);
        }

        // 4. Upsert/Update Logic with Stock Management
        let retailerProduct;
        const requestedStock = Number(stock);

        if (id) {
            // Updating an existing override
            const query = { _id: id };
            if (req.user.role !== 'admin') query.retailerId = retailerId;
            
            const existingOverride = await RetailerProduct.findOne(query);
            if (!existingOverride) return fail(res, new Error('Override not found or unauthorized'), 404);

            const stockDiff = requestedStock - existingOverride.stock;

            if (stockDiff > 0) {
                // Increasing override stock - check if brand has enough
                const isUnlimited = variantDoc.stock === undefined || variantDoc.stock === null;
                if (!isUnlimited && variantDoc.stock < stockDiff) {
                    return fail(res, new Error(`insufficient stock, Please contact with brand`), 400);
                }
            }

            // Perform atomic update on original variant stock
            const isUnlimitedVariant = variantDoc.stock === undefined || variantDoc.stock === null;
            if (!isUnlimitedVariant) {
                await variant.findByIdAndUpdate(variantId, { $inc: { stock: -stockDiff } });
            }

            // Update override
            retailerProduct = await RetailerProduct.findByIdAndUpdate(
                id,
                { mrp_price, selling_price, stock: requestedStock, isActive: isActive !== undefined ? isActive : true },
                { new: true, runValidators: true }
            );
        } else {
            // Creating a new override / Upsert case
            // Check if override already exists to calculate stock difference accurately
            const existingOverride = await RetailerProduct.findOne({ retailerId, productId, variantId });
            const stockDiff = existingOverride ? requestedStock - existingOverride.stock : requestedStock;

            // Check if brand has enough stock
            const isUnlimited = variantDoc.stock === undefined || variantDoc.stock === null;
            if (!isUnlimited && variantDoc.stock < stockDiff) {
                return fail(res, new Error(`insufficient stock, Please contact with brand`), 400);
            }

            // Perform atomic update on original variant stock
            if (!isUnlimited) {
                await variant.findByIdAndUpdate(variantId, { $inc: { stock: -stockDiff } });
            }

            // Use findOneAndUpdate with upsert for the compound unique key
            retailerProduct = await RetailerProduct.findOneAndUpdate(
                { retailerId, productId, variantId },
                {
                    mrp_price,
                    selling_price,
                    stock: requestedStock,
                    isActive: isActive !== undefined ? isActive : true
                },
                { new: true, upsert: true, runValidators: true }
            );
        }

        if (!retailerProduct) {
            return fail(res, new Error('Failed to update retailer product'), 500);
        }

        return success(res, retailerProduct, 201);

    } catch (error) {
        console.error('upsertRetailerProduct error:', error);
        return fail(res, error, 500);
    }
};

export default upsertRetailerProduct;
