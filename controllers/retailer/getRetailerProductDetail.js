import RetailerProduct from "../../models/retailerproduct.js";
import wishlist from "../../models/wishlist.js";
import { success, fail } from '../../middlewares/responseHandler.js';

/**
 * Get detailed product info from retailer inventory context
 * GET /api/retailer/products/detail/:productId
 */
const getRetailerProductDetail = async (req, res) => {
    try {
        const { productId } = req.params;

        // Find all active inventory entries for this product
        const inventoryEntries = await RetailerProduct.find({
            productId,
            isActive: true
        })
            .populate({
                path: 'productId',
                populate: [
                    { path: 'brand', select: 'name logo' },
                    { path: 'categoryId', select: 'name' },
                    { path: 'subcategoryId', select: 'name' },
                    { path: 'subsubcategoryId', select: 'name' },
                    { path: 'createdBy', select: 'name email role' }
                ]
            })
            .populate('variantId')
            .lean();

        if (!inventoryEntries || inventoryEntries.length === 0) {
            return fail(res, new Error("Product not available in retailer inventory"), 404);
        }

        // The root product info is the same for all entries
        const rootProduct = inventoryEntries[0].productId;
        const user_id = req.user && req.user !== "not_login" ? (req.user.id || req.user._id) : null;

        // 1. Check wishlist status for the main product
        let wishlist_status = false;
        if (user_id) {
            const productWishlistEntry = await wishlist.findOne({
                user_id,
                product_id: productId,
            });
            wishlist_status = !!productWishlistEntry;
        }

        // 2. Transform variants to include retailer overrides and wishlist status
        const requestedRetailerId = req.query.retailerId;

        // Group inventory entries by variantId to avoid duplicate variants in the selection list
        // Selection criteria: Prioritize requested retailer, then lowest price.
        const groupedEntries = new Map();
        inventoryEntries.forEach(entry => {
            const vId = entry.variantId?._id?.toString() || entry.variantId?.toString();
            if (!vId) return;

            const existing = groupedEntries.get(vId);
            const isRequestedRetailer = requestedRetailerId && entry.retailerId?.toString() === requestedRetailerId.toString();

            if (!existing) {
                groupedEntries.set(vId, entry);
            } else {
                const existingIsRequested = requestedRetailerId && existing.retailerId?.toString() === requestedRetailerId.toString();

                if (isRequestedRetailer && !existingIsRequested) {
                    groupedEntries.set(vId, entry);
                } else if (isRequestedRetailer === existingIsRequested) {
                    // If both match (or neither match) the requested retailer, pick the cheaper one
                    if (entry.selling_price < existing.selling_price) {
                        groupedEntries.set(vId, entry);
                    }
                }
            }
        });

        const uniqueEntries = Array.from(groupedEntries.values());
        const variantIds = uniqueEntries.map(e => e.variantId?._id).filter(Boolean);
        
        const variantWishlistEntries = user_id
            ? await wishlist.find({
                user_id,
                product_variant_id: { $in: variantIds },
            })
            : [];

        const variantWishlistMap = new Map(
            variantWishlistEntries.map((entry) => [entry.product_variant_id.toString(), true])
        );

        const variantsWithOverrides = uniqueEntries.map(entry => {
            const variant = entry.variantId;
            if (!variant) return null;

            const variantDoc = variant._doc || variant;
            const variantWishlistStatus = variantWishlistMap.has(variant._id.toString());

            return {
                ...variantDoc,
                selling_price: entry.selling_price,
                mrp_price: entry.mrp_price,
                stock: entry.stock,
                retailer_id: entry.retailerId,
                retailerId: entry.retailerId, // Add camelCase for consistency
                override_id: entry._id,
                isRetailerManaged: true,
                wishlist_status: variantWishlistStatus
            };
        }).filter(Boolean);

        // Calculate aggregate metadata based on the best available offers
        const prices = variantsWithOverrides.map(v => v.selling_price).filter(p => p !== undefined);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const totalStock = variantsWithOverrides.reduce((sum, v) => sum + (v.stock || 0), 0);

        // Categories mapping (backward compatibility)
        const parentcategory = rootProduct.categoryId ? [rootProduct.categoryId] : [];
        const childcategory = rootProduct.subcategoryId ? [rootProduct.subcategoryId] : [];
        const subsubcategory = rootProduct.subsubcategoryId ? [rootProduct.subsubcategoryId] : [];

        // Identify the primary retailer for this product view context
        // If we had a requestedRetailerId that matched something, use that, otherwise use the first available
        let primaryRetailerId = requestedRetailerId;
        if (!primaryRetailerId && variantsWithOverrides.length > 0) {
            primaryRetailerId = variantsWithOverrides[0].retailerId;
        }

        const responseData = {
            ...rootProduct,
            variants: variantsWithOverrides,
            minPrice,
            maxPrice,
            totalStock,
            wishlist_status,
            retailer_id: primaryRetailerId,
            retailerId: primaryRetailerId
        };

        return success(res, {
            status: "successfully",
            data: responseData,
            parentcategory,
            childcategory,
            subsubcategory,
            productvariant: variantsWithOverrides, // Backward compatibility
            slug: rootProduct.product_name ? rootProduct.product_name.replace(/\s/g, "-").toLowerCase() : "",
            isRetailerDetail: true
        }, 200);

    } catch (error) {
        console.error('getRetailerProductDetail error:', error);
        return fail(res, error, 500);
    }
};

export default getRetailerProductDetail;
