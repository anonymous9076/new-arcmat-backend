import product from "../../models/product.js";
import variant from "../../models/productVariant.js";
import Category from "../../models/category.js";
import Brand from "../../models/brand.js";
import Usertable from "../../models/user.js";
import { success, fail } from '../../middlewares/responseHandler.js';
import xlsx from 'xlsx';
import slugify from 'slugify';
import path from 'path';

const parseAttributes = (attrString) => {
    if (!attrString || typeof attrString !== 'string') return [];

    const attributes = [];
    const pairs = attrString.split('|').map(s => s.trim());

    for (const pair of pairs) {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
            attributes.push({ key, value });
        }
    }

    return attributes;
};

import cloudinary from "../../config/cloudinary.js";

const imageCache = new Map();

/**
 * Finds an image on Cloudinary by its original name for a specific brand.
 * 
 * @param {string} imageName - Original filename (e.g., "myimage.jpg")
 * @param {string} brandId - The brand ID used for the user_uploads folder/prefix
 * @returns {Promise<Object|null>} - Cloudinary resource object or null
 */
const findImageOnCloudinary = async (imageName, brandId) => {
    try {
        // Cache resources per brand to avoid hitting rate limits
        let resources;
        if (imageCache.has(brandId)) {
            resources = imageCache.get(brandId);
        } else {
            // Fetch all resources with this brand's prefix in the 'products' folder
            // Note: This uses the Admin API and is limited to 500 by default (can paginate if needed)
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: `products/${brandId}_`,
                max_results: 500
            });
            resources = result.resources || [];
            imageCache.set(brandId, resources);
        }

        const baseName = path.parse(imageName).name;
        // The public_id produced by our utility is `products/${brandId}_${baseName}`
        const targetPublicId = `products/${brandId}_${baseName}`;

        const matched = resources.find(res => res.public_id === targetPublicId);

        if (matched) {
            return {
                public_id: matched.public_id,
                secure_url: matched.secure_url
            };
        }

        return null;
    } catch (error) {
        console.error(`Error finding image ${imageName} on Cloudinary for brand ${brandId}:`, error);
        return null;
    }
};


const findOrCreateCategoryHierarchy = async (l1Name, l2Name, l3Name, userId) => {
    if (!l1Name || !l2Name || !l3Name) {
        throw new Error('All three category levels (L1, L2, L3) are required');
    }

    let l1 = await Category.findOne({
        name: new RegExp(`^${l1Name}$`, 'i'),
        level: 1
    });

    if (!l1) {
        const l1Slug = slugify(l1Name, { lower: true, strict: true });
        l1 = await Category.create({
            name: l1Name,
            slug: l1Slug,
            description: l1Name,
            level: 1,
            parentId: null,
            userid: userId
        });
    }

    let l2 = await Category.findOne({
        name: new RegExp(`^${l2Name}$`, 'i'),
        level: 2,
        parentId: l1._id
    });

    if (!l2) {
        const l2Slug = slugify(`${l1Name}-${l2Name}`, { lower: true, strict: true });
        l2 = await Category.create({
            name: l2Name,
            slug: l2Slug,
            description: l2Name,
            level: 2,
            parentId: l1._id,
            userid: userId
        });
    }

    let l3 = await Category.findOne({
        name: new RegExp(`^${l3Name}$`, 'i'),
        level: 3,
        parentId: l2._id
    });

    if (!l3) {
        const l3Slug = slugify(`${l1Name}-${l2Name}-${l3Name}`, { lower: true, strict: true });
        l3 = await Category.create({
            name: l3Name,
            slug: l3Slug,
            description: l3Name,
            level: 3,
            parentId: l2._id,
            userid: userId
        });
    }

    return {
        categoryId: l1._id,
        subcategoryId: l2._id,
        subsubcategoryId: l3._id
    };
};

const findOrCreateBrand = async (brandId, brandName, userId) => {
    if (!brandId && !brandName) {
        throw new Error('Either Brand ID or Brand Name is required');
    }

    if (brandId) {
        const brand = await Brand.findById(brandId);
        if (brand) return brand._id;
    }

    if (brandName) {
        let brand = await Brand.findOne({
            name: new RegExp(`^${brandName}$`, 'i')
        });

        if (brand) return brand._id;

        const brandSlug = slugify(brandName, { lower: true, strict: true });
        brand = await Brand.create({
            name: brandName,
            slug: brandSlug,
            userId: userId,
            description: brandName
        });

        return brand._id;
    }

    throw new Error('Brand not found and could not be created');
};

const bulkimport = async (req, res) => {
    try {
        if (!req.file) {
            return fail(res, new Error('No file uploaded'), 400);
        }

        const { type = 'product' } = req.body;

        // Clear cache at the start of each import request
        imageCache.clear();

        const createdBy = req.user?.id || null;
        if (!createdBy) {
            return fail(res, new Error('User authentication required'), 401);
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return fail(res, new Error('The uploaded file is empty'), 400);
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [],
            skipped: []
        };

        if (type === 'variant') {
            const variantsToInsert = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNum = i + 2;

                try {
                    const baseSKU = row['Unique Code'] || row['Product Base SKU Code'] || row['Base SKU Code'] || row['unique_code'] || row['base_sku'];
                    const variantSKU = row['Variant SKU Code'] || row['SKU Code'] || row['skucode'];

                    if (!baseSKU) {
                        results.skipped.push({
                            row: rowNum,
                            variantSKU: variantSKU || 'N/A',
                            baseSKU: 'Missing',
                            reason: 'Missing Product Unique Code'
                        });
                        results.failed++;
                        continue;
                    }

                    if (!variantSKU) {
                        results.skipped.push({
                            row: rowNum,
                            variantSKU: 'Missing',
                            baseSKU: baseSKU,
                            reason: 'Missing Variant SKU Code'
                        });
                        results.failed++;
                        continue;
                    }

                    const parentProduct = await product.findOne({ product_unique_id: baseSKU });
                    if (!parentProduct) {
                        results.skipped.push({
                            row: rowNum,
                            variantSKU: variantSKU,
                            baseSKU: baseSKU,
                            reason: `Product with Base SKU "${baseSKU}" not found`
                        });
                        results.failed++;
                        continue;
                    }

                    const skuExistsInProducts = await product.findOne({ product_unique_id: variantSKU });
                    const skuExistsInVariants = await variant.findOne({ skucode: variantSKU });
                    if (skuExistsInProducts || skuExistsInVariants) {
                        results.skipped.push({
                            row: rowNum,
                            variantSKU: variantSKU,
                            baseSKU: baseSKU,
                            reason: `Variant SKU "${variantSKU}" already exists`
                        });
                        results.failed++;
                        continue;
                    }

                    const attributesStr = row['Attributes'] || row['attributes'] || '';
                    const dynamicAttributes = parseAttributes(attributesStr);

                    let variantImages = [];
                    if (row['Variant Images'] || row['Images']) {
                        const imageNames = (row['Variant Images'] || row['Images']).split(',').map(img => img.trim());
                        const parentBrandId = parentProduct.brand.toString();

                        for (const imageName of imageNames) {
                            const matchedImage = await findImageOnCloudinary(imageName, parentBrandId);
                            if (matchedImage) {
                                variantImages.push(matchedImage); // Store { public_id, secure_url }
                            } else {
                                console.warn(`Variant image not found: ${imageName} for brand ${parentBrandId}`);
                            }
                        }

                    }

                    const variantData = {
                        productId: parentProduct._id,
                        skucode: variantSKU,
                        mrp_price: row['MRP Price'] || row['mrp_price'] || 0,
                        selling_price: row['Selling Price'] || row['selling_price'] || 0,
                        stock: (row['Stock'] !== undefined && row['Stock'] !== '') ? row['Stock'] : (row['stock'] !== undefined && row['stock'] !== '') ? row['stock'] : null,
                        weight: row['Weight'] || row['weight'] || 0,
                        weight_type: row['Weight Type'] || row['weight_type'] || 'ml',
                        status: 0,
                        variant_images: variantImages,
                        dynamicAttributes
                    };

                    variantsToInsert.push(variantData);
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push(`Row ${rowNum}: ${err.message}`);
                }
            }

            if (variantsToInsert.length > 0) {
                await variant.insertMany(variantsToInsert);
            }

            return success(res, {
                message: `Bulk variant import completed: ${results.success} variants added, ${results.failed} failed/skipped.`,
                details: results
            }, 201);

        } else {
            const productsToInsert = [];

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const rowNum = i + 2;

                try {
                    const productName = row['Product Name'] || row['product_name'];
                    const baseSKU = row['Unique Code'] || row['Base SKU Code'] || row['SKU Code'] || row['unique_code'] || row['skucode'];
                    const productURL = row['Product URL'] || row['Slug'] || row['product_url'];
                    const categoryL1 = row['Category L1'] || row['Category (L1)'];
                    const categoryL2 = row['Category L2'] || row['Sub Category (L2)'];
                    const categoryL3 = row['Category L3'] || row['Sub-Sub Category (L3)'];
                    const brandId = row['Brand ID'] || row['brand_id'];
                    const brandName = row['Brand Name'] || row['brand_name'] || row['Brand'];

                    if (!productName) {
                        results.skipped.push({
                            row: rowNum,
                            productName: 'Missing',
                            sku: baseSKU || 'N/A',
                            reason: 'Missing Product Name'
                        });
                        results.failed++;
                        continue;
                    }

                    if (!categoryL1 || !categoryL2 || !categoryL3) {
                        results.skipped.push({
                            row: rowNum,
                            productName: productName,
                            sku: baseSKU || 'N/A',
                            reason: 'Missing Category (L1, L2, or L3)'
                        });
                        results.failed++;
                        continue;
                    }

                    if (!brandId && !brandName) {
                        results.skipped.push({
                            row: rowNum,
                            productName: productName,
                            sku: baseSKU || 'N/A',
                            reason: 'Missing Brand (ID or Name)'
                        });
                        results.failed++;
                        continue;
                    }

                    if (!baseSKU) {
                        results.skipped.push({
                            row: rowNum,
                            productName: productName,
                            sku: 'Missing',
                            reason: 'Missing Base SKU Code'
                        });
                        results.failed++;
                        continue;
                    }

                    if (!productURL) {
                        results.skipped.push({
                            row: rowNum,
                            productName: productName,
                            sku: baseSKU,
                            reason: 'Missing Product URL/Slug'
                        });
                        results.failed++;
                        continue;
                    }

                    const { categoryId, subcategoryId, subsubcategoryId } =
                        await findOrCreateCategoryHierarchy(categoryL1, categoryL2, categoryL3, createdBy);

                    // Enforce brand owner restriction if not an admin
                    let brandObjectId;
                    if (req.user.role === 'brand') {
                        const rawId = (req.user.selectedBrands && req.user.selectedBrands[0]);
                        brandObjectId = (rawId?._id || rawId?.id || rawId);
                    } else {
                        brandObjectId = await findOrCreateBrand(brandId, brandName, createdBy);
                    }

                    const sluggedUrl = slugify(productURL, { lower: true, strict: true });
                    const urlExists = await product.findOne({ product_url: sluggedUrl });
                    if (urlExists) {
                        results.skipped.push({
                            row: rowNum,
                            productName: productName,
                            sku: baseSKU,
                            reason: `Product URL "${sluggedUrl}" already exists`
                        });
                        results.failed++;
                        continue;
                    }

                    const skuExistsInProducts = await product.findOne({ product_unique_id: baseSKU });
                    const skuExistsInVariants = await variant.findOne({ skucode: baseSKU });
                    if (skuExistsInProducts || skuExistsInVariants) {
                        results.skipped.push({
                            row: rowNum,
                            productName: productName,
                            sku: baseSKU,
                            reason: `SKU "${baseSKU}" already exists`
                        });
                        results.failed++;
                        continue;
                    }

                    let productImages = [];
                    if (row['Images']) {
                        const imageNames = row['Images'].split(',').map(img => img.trim());
                        for (const imageName of imageNames) {
                            const matchedImage = await findImageOnCloudinary(imageName, brandObjectId.toString());
                            if (matchedImage) {
                                productImages.push(matchedImage); // Store { public_id, secure_url }
                            } else {
                                console.warn(`Image not found: ${imageName} for brand ${brandObjectId}`);
                            }
                        }

                    }

                    if (productImages.length === 0) {
                        productImages = ['placeholder.jpg'];
                    }

                    const productData = {
                        product_name: productName,
                        product_url: sluggedUrl,
                        description: row['Description'] || row['description'] || '',
                        meta_title: row['Meta Title'] || row['meta_title'] || '',
                        meta_keywords: row['Meta Keywords'] || row['meta_keywords'] || '',
                        meta_description: row['Meta Description'] || row['meta_description'] || '',
                        status: 0,
                        subsubcategoryId,
                        subcategoryId,
                        categoryId,
                        product_unique_id: baseSKU,
                        brand: brandObjectId,
                        createdBy,
                        product_images: productImages,
                        dynamicAttributes: []
                    };

                    productsToInsert.push(productData);
                    results.success++;
                } catch (err) {
                    results.failed++;
                    results.errors.push(`Row ${rowNum}: ${err.message}`);
                }
            }

            if (productsToInsert.length > 0) {
                await product.insertMany(productsToInsert);
            }

            return success(res, {
                message: `Bulk product import completed: ${results.success} products added, ${results.failed} failed/skipped.`,
                details: results
            }, 201);
        }

    } catch (err) {
        console.error('bulkimport error:', err);
        return fail(res, err, 500);
    }
};

export default bulkimport;
