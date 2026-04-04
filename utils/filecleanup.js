import { s3Delete } from './s3upload.js';

/**
 * Clean up images from S3 (and optionally local filesystem)
 * @param {Array} images Array of image objects { public_id, secure_url } or strings
 */
export const cleanupImages = async (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) return;

    const publicIdsToDelete = images
        .map(img => typeof img === 'object' ? img.public_id : null)
        .filter(id => !!id);

    if (publicIdsToDelete.length > 0) {
        try {
            await s3Delete(publicIdsToDelete);
        } catch (err) {
            console.error('Failed to delete assets from S3:', err);
        }
    }
};

