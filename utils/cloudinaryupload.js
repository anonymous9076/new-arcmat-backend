import cloudinary from '../config/cloudinary.js';
import path from 'path';


export const cloudinaryUpload = async (userId, files, folder = 'user_uploads') => {
    try {
        // If files is not an array, wrap it in one
        const filesToUpload = Array.isArray(files) ? files : [files];

        const uploadPromises = filesToUpload.map(async (file) => {
            // Extract image name without extension
            const imageName = path.parse(file.originalname).name;

            // public_id structure: userId_imageName
            const publicId = `${userId}_${imageName}`;

            // Upload to Cloudinary using upload_stream for buffers
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: folder,
                        public_id: publicId,
                        overwrite: true,
                        resource_type: 'auto',
                    },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve({
                            public_id: result.public_id,
                            secure_url: result.secure_url,
                        });
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        const results = await Promise.all(uploadPromises);
        return results;

    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error(`Failed to upload image(s) to Cloudinary: ${error.message}`);
    }
};


/**
 * Deletes one or multiple images from Cloudinary.
 * 
 * @param {string|Array} publicIds - Single public_id or an array of public_ids.
 * @returns {Promise<Object>} - Cloudinary deletion result.
 */
export const cloudinaryDelete = async (publicIds) => {
    try {
        const idsToDelete = Array.isArray(publicIds) ? publicIds : [publicIds];

        if (idsToDelete.length === 0) return { result: 'nothing to delete' };

        // Note: delete_resources returns a summary of deleted resources
        const result = await cloudinary.api.delete_resources(idsToDelete);
        return result;
    } catch (error) {
        console.error('Cloudinary deletion error:', error);
        throw new Error(`Failed to delete image(s) from Cloudinary: ${error.message}`);
    }
};

