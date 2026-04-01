import { cloudinaryUpload } from './cloudinaryupload.js';

/**
 * Recursively scans an object for base64 image strings and uploads them to Cloudinary.
 * @param {Object|Array} obj - The object to sanitize
 * @param {String} userId - The ID of the user performing the action
 * @returns {Promise<Object|Array>} - The sanitized object with Cloudinary URLs
 */
export const sanitizeAndUpload = async (obj, userId) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return Promise.all(obj.map(item => sanitizeAndUpload(item, userId)));
    }

    const newObj = { ...obj };
    let hasChanged = false;

    for (const key in newObj) {
        const value = newObj[key];
        if (typeof value === 'string' && value.startsWith('data:image')) {
            // Extract base64 and upload to Cloudinary
            try {
                const base64Data = value.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const pseudoFile = {
                    buffer,
                    originalname: `custom_photo_${Date.now()}.png`
                };
                const results = await cloudinaryUpload(userId, pseudoFile, 'moodboards/custom');
                if (results && results.length > 0) {
                    newObj[key] = results[0].secure_url;
                    // If it's a fabric.js object with 'images' array, update that too
                    if (newObj.images && Array.isArray(newObj.images)) {
                        newObj.images = [results[0].secure_url];
                    }
                    hasChanged = true;
                }
            } catch (err) {
                console.error("Failed to sanitize base64 image:", err);
            }
        } else if (typeof value === 'object' && value !== null) {
            const sanitizedChild = await sanitizeAndUpload(value, userId);
            if (sanitizedChild !== value) {
                newObj[key] = sanitizedChild;
                hasChanged = true;
            }
        }
    }
    return hasChanged ? newObj : obj;
};

/**
 * Extracts preview thumbnails from canvas state.
 * @param {Array} canvasState - The fabric.js canvas state
 * @returns {Array<String>} - Array of thumbnail URLs
 */
export const extractPreviewImages = (canvasState) => {
    if (!Array.isArray(canvasState)) return [];

    return canvasState
        .filter(item => item.type === 'material' && item.material)
        .slice(0, 4)
        .map(item => {
            const m = item.material;
            let url = null;

            if (m.photoUrl) {
                url = m.photoUrl;
            } else if (m.images && Array.isArray(m.images) && m.images.length > 0) {
                url = m.images[0];
            } else if (m.variant_images && Array.isArray(m.variant_images) && m.variant_images.length > 0) {
                url = m.variant_images[0];
            } else if (m.productId && typeof m.productId === 'object') {
                // Check common image field names for products
                const p = m.productId;
                url = p.product_images?.[0] || p.images?.[0] || p.thumbnail || null;
            }

            // If we have an object, resolve to its secure_url string
            if (url && typeof url === 'object') {
                return url.secure_url || url.url || null;
            }

            return typeof url === 'string' ? url : null;
        })
        .filter(url => url !== null);
};
