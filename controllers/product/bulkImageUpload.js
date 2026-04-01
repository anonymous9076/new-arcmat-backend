import AdmZip from 'adm-zip';
import path from 'path';
import { success, fail } from '../../middlewares/responseHandler.js';
import { cloudinaryUpload } from '../../utils/cloudinaryupload.js';

const bulkImageUpload = async (req, res) => {
    try {
        if (!req.file) {
            return fail(res, new Error('No ZIP file uploaded'), 400);
        }

        if (!req.file.originalname.endsWith('.zip')) {
            return fail(res, new Error('Only ZIP files are allowed'), 400);
        }

        // Resolve brand from user profile or admin query
        const rawBrandId = (req.user.role === 'admin' && req.query.brandId)
            ? req.query.brandId
            : (req.user.selectedBrands && req.user.selectedBrands[0]);

        const brandId = (rawBrandId?._id || rawBrandId?.id || rawBrandId).toString();
        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();

        const imageMapping = {};
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

        const filesToUpload = [];

        for (const entry of zipEntries) {
            if (entry.isDirectory) continue;

            const entryName = entry.entryName;
            const ext = path.extname(entryName).toLowerCase();

            if (!allowedExtensions.includes(ext)) {
                continue;
            }

            const originalName = path.basename(entryName);

            // Create a pseudo-Multer file object using memory buffer
            filesToUpload.push({
                buffer: entry.getData(),
                originalname: originalName
            });
        }

        if (filesToUpload.length === 0) {
            return fail(res, new Error('No valid image files found in ZIP'), 400);
        }

        // Upload to Cloudinary using our utility (now handles buffers)
        const uploadResults = await cloudinaryUpload(brandId, filesToUpload, 'products');

        // Map original names back to upload results
        uploadResults.forEach((result, index) => {
            const originalName = filesToUpload[index].originalname;
            imageMapping[originalName] = result;
        });

        return success(res, {
            message: `Successfully uploaded ${uploadResults.length} images to Cloudinary`,
            brandId,
            imageMapping,
            uploadedCount: uploadResults.length
        }, 200);

    } catch (err) {
        console.error('bulkImageUpload error:', err);
        return fail(res, err, 500);
    }
};

export default bulkImageUpload;

