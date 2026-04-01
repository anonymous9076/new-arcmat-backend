import product from '../models/product.js';
import variant from '../models/productVariant.js';

// Cache for product brand lookups (5-minute TTL for performance )
const productBrandCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Middleware to extract brand ID from parent product for variant uploads
 * Handles both create (productId in body) and update (fetch variant first) scenarios
 * Sets req.brandId for use by multer
 */
const extractProductBrandId = async (req, res, next) => {
    try {
        let productId = req.body.productId;

        // For UPDATE requests, productId might not be in body
        // We need to fetch the existing variant first to get the productId
        if (!productId && req.params.id) {
            const existingVariant = await variant.findById(req.params.id)
                .select('productId')
                .lean();

            if (!existingVariant) {
                return res.status(404).json({
                    success: false,
                    message: 'Variant not found'
                });
            }

            productId = existingVariant.productId.toString();
        }

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required for variant upload'
            });
        }

        // Check cache first (performance optimization)
        const cached = productBrandCache.get(productId);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            req.brandId = cached.brandId;
            return next();
        }

        // Single optimized query with lean() for performance
        const parentProduct = await product.findById(productId)
            .select('brand')
            .lean();

        if (!parentProduct) {
            return res.status(404).json({
                success: false,
                message: 'Parent product not found'
            });
        }

        if (!parentProduct.brand) {
            return res.status(400).json({
                success: false,
                message: 'Parent product does not have a brand assigned'
            });
        }

        // Set brand ID for multer to use
        req.brandId = parentProduct.brand.toString();

        // Cache the result for future requests
        productBrandCache.set(productId, {
            brandId: req.brandId,
            timestamp: Date.now()
        });

        next();
    } catch (error) {
        console.error('extractProductBrandId error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to extract brand information from parent product'
        });
    }
};

// Optional: Clear expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [productId, data] of productBrandCache.entries()) {
        if (now - data.timestamp > CACHE_TTL) {
            productBrandCache.delete(productId);
        }
    }
}, CACHE_TTL);

export default extractProductBrandId;
