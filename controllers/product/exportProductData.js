import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import { success, fail } from "../../middlewares/responseHandler.js";
import xlsx from "xlsx";
import AdmZip from "adm-zip";
import path from "path";
import Usertable from "../../models/user.js";


const exportProductData = async (req, res) => {
    try {
        const userId = req.user.id;
        // Determine the target user ID for data retrieval
        // Brands export their own data. Admins export based on query param or their own (if any).
        let targetUserId = userId;
        if (req.user.role === 'admin' && req.query.brandId) {
            targetUserId = req.query.brandId;
        }

        // Resolve brand ID
        const rawBrandId = (req.user.role === 'admin' && req.query.brandId)
            ? req.query.brandId
            : (req.user.selectedBrands && req.user.selectedBrands[0]);

        let resolvedBrandId = (rawBrandId?._id || rawBrandId?.id || rawBrandId);

        if (!resolvedBrandId) {
            return fail(res, new Error('Brand context not found. Admin must provide brandId or user must have selectedBrands.'), 400);
        }

        // If the ID passed belongs to a user, find their associated brand ID
        const existingUser = await Usertable.findById(resolvedBrandId);
        if (existingUser && existingUser.selectedBrands && existingUser.selectedBrands.length > 0) {
            resolvedBrandId = existingUser.selectedBrands[0];
        }

        const brandId = resolvedBrandId.toString();


        // 2. Fetch Products
        // Prefer filtering by brand if we have a brand context
        const queryFilter = brandId ? { brand: brandId } : { createdBy: targetUserId };

        const products = await product.find(queryFilter)
            .populate('categoryId', 'name')
            .populate('subcategoryId', 'name')
            .populate('subsubcategoryId', 'name')
            .populate('brand', 'name')
            .lean();


        // 3. Fetch Variants
        // We need to fetch variants for these products
        const productIds = products.map(p => p._id);
        const variants = await variant.find({ productId: { $in: productIds } }).lean();

        // 4. Prepare Data for Excel
        const productRows = [];
        const variantRows = [];
        const imagesToZip = new Set(); // Store unique image names to add to ZIP

        // Helper to process image paths and extract clean filenames
        const processImages = (imagePaths) => {
            if (!imagePaths || !Array.isArray(imagePaths)) return '';

            const cleanNames = [];
            imagePaths.forEach(img => {
                // 1. Handle S3/Remote objects (New format)
                if (img && typeof img === 'object' && img.secure_url) {
                    // Extract a clean name from the public_id or URL
                    // public_id (Key) is usually "products/brandId_originalName_timestamp.ext"
                    let originalName = '';
                    if (img.public_id) {
                        const parts = img.public_id.split('_');
                        if (parts.length >= 2) {
                            // Recover original name: skip prefix (products/brandId_) and timestamp/unique parts
                            const basePart = img.public_id.split('/').pop(); // brandId_originalName_timestamp.ext
                            const nameParts = basePart.split('_');
                            if (nameParts.length >= 3) {
                                // Slice off brandId (first) and timestamp/unique parts (last)
                                originalName = nameParts.slice(1, -1).join('_');
                            } else {
                                originalName = basePart;
                            }
                        } else {
                            originalName = img.public_id.split('/').pop();
                        }
                    } else {
                        originalName = img.secure_url.split('/').pop();
                    }

                    // Ensure extension if missing
                    if (!path.extname(originalName)) {
                        const urlExt = path.extname(img.secure_url.split('?')[0]);
                        originalName += urlExt || '.jpg';
                    }

                    cleanNames.push(originalName);
                    imagesToZip.add({
                        type: 'remote',
                        url: img.secure_url,
                        zipName: originalName
                    });
                    return;
                }

                // 2. Handle Legacy Strings (Local paths) - Skip for Vercel
                if (typeof img !== 'string') return;

                const parts = img.split('/');
                const filename = parts[parts.length - 1];

                let originalName = filename;
                const nameParts = filename.split('-');
                if (nameParts.length >= 3) {
                    const timestamp = nameParts[0];
                    if (/^\d{13}$/.test(timestamp)) {
                        originalName = nameParts.slice(2).join('-');
                    }
                }

                cleanNames.push(originalName);
                // We no longer add local images to zip because they won't exist on Vercel
            });

            return cleanNames.join(', ');
        };


        // --- Process Products ---
        for (const p of products) {
            // Format images
            const imageString = processImages(p.product_images);

            productRows.push({
                'Product Name': p.product_name,
                'Unique Code': p.product_unique_id,
                'Product URL': p.product_url, // Slug
                'Category L1': p.categoryId?.name || '',
                'Category L2': p.subcategoryId?.name || '',
                'Category L3': p.subsubcategoryId?.name || '',
                'Brand Name': p.brand?.name || '',
                'Brand ID': (p.brand?._id || p.brand)?.toString() || '',
                'Status': p.status === 1 ? 'Active' : 'Inactive',
                'Images': imageString,
                'Description': p.description || '',
                'Meta Title': p.meta_title || '',
                'Meta Keywords': p.meta_keywords || '',
                'Meta Description': p.meta_description || ''
            });
        }

        // --- Process Variants ---
        for (const v of variants) {
            // Find parent product for Base SKU
            const parent = products.find(p => p._id.toString() === v.productId.toString());
            const baseSKU = parent ? parent.product_unique_id : 'UNKNOWN_PARENT';

            // Format dynamic attributes
            // Input format expected: "Color: Red | Size: XL"
            let attrString = '';
            if (v.dynamicAttributes && Array.isArray(v.dynamicAttributes)) {
                attrString = v.dynamicAttributes.map(a => `${a.key}: ${a.value}`).join(' | ');
            }

            const imageString = processImages(v.variant_images);

            variantRows.push({
                'Unique Code': baseSKU,
                'Variant SKU Code': v.skucode,
                'MRP Price': v.mrp_price,
                'Selling Price': v.selling_price,
                'Stock': v.stock,
                'Weight': v.weight,
                'Weight Type': v.weight_type,
                'Attributes': attrString,
                'Images': imageString
            });
        }

        // 5. Generate Excel Buffers
        const productSheet = xlsx.utils.json_to_sheet(productRows);
        const variantSheet = xlsx.utils.json_to_sheet(variantRows);

        // Create workbooks (doing separate files for clarity in ZIP, or we could do one workbook with two sheets? 
        // Requirement says "products.xlsx" and "variants.xlsx" separately.
        // Let's stick to separate files as per plan.

        const wbProducts = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wbProducts, productSheet, "Products");
        const productBuffer = xlsx.write(wbProducts, { type: "buffer", bookType: "xlsx" });

        const wbVariants = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wbVariants, variantSheet, "Variants");
        const variantBuffer = xlsx.write(wbVariants, { type: "buffer", bookType: "xlsx" });

        // 6. Generate Images ZIP
        const imagesZip = new AdmZip();

        // Separate local and remote images for optimized processing
        const imageList = Array.from(imagesToZip);
        const remoteImages = imageList.filter(img => img.type === 'remote');

        // Process Remote (S3) Images - Parallel Download
        if (remoteImages.length > 0) {
            const downloadPromises = remoteImages.map(async ({ url, zipName }) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    imagesZip.addFile(zipName, buffer);
                } catch (err) {
                    console.error(`Failed to download remote ${url} for zip`, err);
                }
            });
            await Promise.all(downloadPromises);
        }

        const imagesZipBuffer = imagesZip.toBuffer();

        // 7. Generate Master ZIP
        const masterZip = new AdmZip();
        masterZip.addFile("products.xlsx", productBuffer);
        masterZip.addFile("variants.xlsx", variantBuffer);
        masterZip.addFile("images.zip", imagesZipBuffer);

        const downloadBuffer = masterZip.toBuffer();
        const fileName = `export_data_${Date.now()}.zip`;


        // 8. Send Response
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=${fileName}`);
        res.set('Content-Length', downloadBuffer.length);
        res.send(downloadBuffer);

    } catch (error) {
        console.error("Export Error:", error);
        return fail(res, error, 500);
    }
};

export default exportProductData;
