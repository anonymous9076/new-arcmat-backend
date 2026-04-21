import RetailerProduct from '../../models/retailerproduct.js';
import variant from '../../models/productVariant.js';
import { success, fail } from '../../middlewares/responseHandler.js';

import Product from '../../models/product.js';

/**
 * Bulk add products to retailer inventory
 * POST /retailer/inventory/bulk-add
 */
const bulkAddInventory = async (req, res) => {
    try {
        const { variants, isGlobalSelectAll, brandId, search, excludedVariantIds = [] } = req.body;

        let retailerId = req.user.id;
        // If admin is doing this on behalf of retailer, allow retailerId in body
        if (req.user.role === 'admin' && req.body.retailerId) {
            retailerId = req.body.retailerId;
        }

        let targetVariants = []; // Will hold { productId, variantId, mrp_price, selling_price }

        if (isGlobalSelectAll && brandId) {
            // Global select all logic across pagination
            const query = { brand: brandId, status: 1 };
            if (search && search.trim().length > 0) {
                query.product_name = { $regex: search, $options: "i" };
            }

            const productsRaw = await Product.find(query).select('_id').lean();
            const productIds = productsRaw.map(p => p._id);

            const allVariants = await variant.find({ productId: { $in: productIds } }).lean();

            targetVariants = allVariants
                .filter(v => !excludedVariantIds.includes(v._id.toString()))
                .map(v => ({
                    productId: v.productId,
                    variantId: v._id,
                    mrp_price: v.mrp_price || 0,
                    selling_price: v.selling_price || v.mrp_price || 0
                }));
        } else {
            // Partial selection logic
            if (!Array.isArray(variants) || variants.length === 0) {
                return fail(res, new Error("Please provide variants to add"), 400);
            }
            
            // Resolve base prices for specifically requested variants
            const variantIds = variants.map(v => v.variantId);
            const variantDataList = await variant.find({ _id: { $in: variantIds } }).lean();
            
            targetVariants = variants.map(v => {
                const vData = variantDataList.find(dbV => dbV._id.toString() === v.variantId.toString());
                return {
                    productId: v.productId,
                    variantId: v.variantId,
                    mrp_price: vData?.mrp_price || 0,
                    selling_price: vData?.selling_price || vData?.mrp_price || 0
                };
            });
        }

        if (targetVariants.length === 0) {
            return fail(res, new Error("No variants available or all were excluded"), 400);
        }

        // Filter out any variants missing critical IDs
        const validVariants = targetVariants.filter(item => item.productId && item.variantId);

        if (validVariants.length === 0) {
            return fail(res, new Error("No valid variants to add"), 400);
        }

        // Use bulkWrite with upsert to prevent E11000 duplicate key errors
        // If the record already exists, it will do nothing (or just ensure it's active)
        const bulkOps = validVariants.map(item => ({
            updateOne: {
                filter: { 
                    retailerId: retailerId, 
                    productId: item.productId, 
                    variantId: item.variantId 
                },
                update: {
                    $setOnInsert: {
                        retailerId,
                        productId: item.productId,
                        variantId: item.variantId,
                        mrp_price: item.mrp_price,
                        selling_price: item.selling_price,
                        stock: null, // Allow no stock by default
                        isActive: true
                    }
                },
                upsert: true
            }
        }));

        const result = await RetailerProduct.bulkWrite(bulkOps, { ordered: false });

        const addedCount = result.upsertedCount || 0;
        const skippedCount = targetVariants.length - addedCount;

        return success(res, {
            message: `Successfully added ${addedCount} products to inventory. Skipped ${skippedCount} (already existing).`,
            addedCount,
            skippedCount
        }, 200);

    } catch (error) {
        console.error('bulkAddInventory error:', error);
        return fail(res, error, 500);
    }
};

export default bulkAddInventory;
