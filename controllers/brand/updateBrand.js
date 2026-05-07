import Brand from "../../models/brand.js";
import slugify from 'slugify';
import { success, fail } from '../../middlewares/responseHandler.js';
import mongoose from 'mongoose';
import { s3Upload, s3Delete } from '../../utils/s3upload.js';

const parseMaybeJson = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeObjectIdArray = (value) => {
  const parsed = parseMaybeJson(value, []);
  const list = Array.isArray(parsed) ? parsed : String(parsed || '').split(',');
  return list.filter((id) => mongoose.Types.ObjectId.isValid(id));
};

const normalizeReviews = (value) => {
  const parsed = parseMaybeJson(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((review) => ({
      name: String(review?.name || '').trim(),
      role: String(review?.role || '').trim(),
      rating: Math.min(5, Math.max(1, Number(review?.rating) || 5)),
      comment: String(review?.comment || '').trim()
    }))
    .filter((review) => review.name || review.comment);
};

const normalizeStringArray = (value) => {
  const parsed = parseMaybeJson(value, []);
  const list = Array.isArray(parsed) ? parsed : String(parsed || '').split(',');
  return list.map((item) => String(item || '').trim()).filter(Boolean);
};

const normalizePlainObject = (value) => {
  const parsed = parseMaybeJson(value, {});
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
};

const normalizeEditableArray = (value, mapper) => {
  const parsed = parseMaybeJson(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(mapper).filter(Boolean);
};

const uploadIndexedBespokeFiles = async (filesByField, prefix, items, targetKey, currentItems = [], currentKey = targetKey, currentUserId) => {
  const nextItems = [...items];
  for (let index = 0; index < nextItems.length; index += 1) {
    const files = filesByField?.[`${prefix}_${index}`];
    if (!files) continue;
    const uploadResults = await s3Upload(currentUserId || 'admin', files, 'brands');
    if (uploadResults.length > 0) {
      const oldMedia = currentItems[index]?.[currentKey];
      if (oldMedia?.public_id) {
        s3Delete(oldMedia.public_id).catch(err => console.error('S3 cleanup error during bespoke card media update:', err));
      }
      nextItems[index] = { ...nextItems[index], [targetKey]: uploadResults[0] };
    }
  }
  return nextItems;
};

const updatebrand = async (req, res) => {
  try {
    const { name, country, description, website, isActive, showOnHomepage, userId, shippingAddress, billingAddress } = req.body;

    // Load existing brand to handle image deletion
    const existingBrand = await Brand.findById(req.params.id).lean();
    if (!existingBrand) return fail(res, new Error('brand not found'), 404);

    const currentUserId = req.user?.id || req.user?._id;
    if (req.user?.role === 'brand' && String(existingBrand.userId) !== String(currentUserId)) {
      return fail(res, new Error('You can only edit your own brand'), 403);
    }

    let logo = req.body.logo;
    if (req.files && (req.files.brand_image || req.files.logo)) {
      const files = req.files.brand_image || req.files.logo;
      const uploadResults = await s3Upload(req.user?.id || 'admin', files, 'brands');
      if (uploadResults.length > 0) {
        logo = uploadResults[0];

        // Delete old logo if it was an S3 object
        if (existingBrand.logo && existingBrand.logo.public_id) {
          s3Delete(existingBrand.logo.public_id).catch(err => console.error('S3 cleanup error during brand update:', err));
        }
      }
    }

    const uploadSingleBespokeImage = async (fieldName, oldImage) => {
      const files = req.files?.[fieldName];
      if (!files) return undefined;
      const uploadResults = await s3Upload(currentUserId || 'admin', files, 'brands');
      if (uploadResults.length > 0) {
        if (oldImage?.public_id) {
          s3Delete(oldImage.public_id).catch(err => console.error('S3 cleanup error during bespoke image update:', err));
        }
        return uploadResults[0];
      }
      return undefined;
    };

    const updateObj = {};
    if (name !== undefined) {
      updateObj.name = name;
      updateObj.slug = slugify(name, { lower: true });
    }
    if (country !== undefined) updateObj.country = country;
    if (description !== undefined) updateObj.description = description;
    if (website !== undefined) updateObj.website = website;
    if (isActive !== undefined) updateObj.isActive = Number(isActive);
    if (showOnHomepage !== undefined) updateObj.showOnHomepage = Number(showOnHomepage);
    if (userId !== undefined) updateObj.userId = userId;

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    if (shippingAddress !== undefined) updateObj.shippingAddress = shippingAddress;
    if (billingAddress !== undefined) updateObj.billingAddress = billingAddress;
    if (logo !== undefined) updateObj.logo = logo;

    const bespokeFields = [
      'bespokeHeadline',
      'bespokeBio',
      'bespokeSelectedProductIds',
      'bespokeSelectedRetailerIds',
      'bespokeSelectedContractorIds',
      'bespokeReviews',
      'bespokeExistingGalleryMedia',
      'bespokeIsPublished',
      'bespokeTags',
      'bespokeTheme',
      'bespokeContact',
      'bespokeSolutions',
      'bespokeCollections',
      'bespokeCatalogs',
      'bespokeVideos',
      'bespokeNews'
    ];
    const hasBespokePayload = bespokeFields.some((field) => req.body[field] !== undefined)
      || req.files?.bespokeHeroImage
      || req.files?.bespokeCustomImage
      || req.files?.bespokeGalleryMedia;

    if (hasBespokePayload) {
      const currentBespoke = existingBrand.bespokePage || {};
      const bespokePage = { ...currentBespoke };

      if (req.body.bespokeHeadline !== undefined) bespokePage.headline = req.body.bespokeHeadline;
      if (req.body.bespokeBio !== undefined) bespokePage.bio = req.body.bespokeBio;
      if (req.body.bespokeSelectedProductIds !== undefined) bespokePage.selectedProductIds = normalizeObjectIdArray(req.body.bespokeSelectedProductIds);
      if (req.body.bespokeSelectedRetailerIds !== undefined) bespokePage.selectedRetailerIds = normalizeObjectIdArray(req.body.bespokeSelectedRetailerIds);
      if (req.body.bespokeSelectedContractorIds !== undefined) bespokePage.selectedContractorIds = normalizeObjectIdArray(req.body.bespokeSelectedContractorIds);
      if (req.body.bespokeReviews !== undefined) bespokePage.reviews = normalizeReviews(req.body.bespokeReviews);
      if (req.body.bespokeIsPublished !== undefined) bespokePage.isPublished = req.body.bespokeIsPublished === true || req.body.bespokeIsPublished === 'true' || req.body.bespokeIsPublished === '1';
      if (req.body.bespokeTags !== undefined) bespokePage.tags = normalizeStringArray(req.body.bespokeTags);
      if (req.body.bespokeTheme !== undefined) bespokePage.theme = normalizePlainObject(req.body.bespokeTheme);
      if (req.body.bespokeContact !== undefined) bespokePage.contact = normalizePlainObject(req.body.bespokeContact);
      if (req.body.bespokeSolutions !== undefined) {
        bespokePage.solutions = normalizeEditableArray(req.body.bespokeSolutions, (item) => {
          const title = String(item?.title || '').trim();
          if (!title) return null;
          return {
            title,
            image: item?.image || '',
            text: String(item?.text || '').trim()
          };
        });
      }
      if (req.body.bespokeCollections !== undefined) {
        bespokePage.collections = normalizeEditableArray(req.body.bespokeCollections, (item) => {
          const title = String(item?.title || '').trim();
          if (!title) return null;
          return {
            title,
            image: item?.image || '',
            materials: normalizeStringArray(item?.materials || []),
            variants: normalizeStringArray(item?.variants || []),
            specs: normalizeStringArray(item?.specs || [])
          };
        });
      }
      if (req.body.bespokeCatalogs !== undefined) {
        bespokePage.catalogs = normalizeEditableArray(req.body.bespokeCatalogs, (item) => {
          const title = String(item?.title || '').trim();
          if (!title) return null;
          return {
            title,
            year: String(item?.year || '').trim(),
            pages: Number(item?.pages) || 0,
            featured: item?.featured === true || item?.featured === 'true',
            cover: item?.cover || '',
            file: item?.file || null,
            url: String(item?.url || '').trim()
          };
        });
      }
      if (req.body.bespokeVideos !== undefined) {
        bespokePage.videos = normalizeEditableArray(req.body.bespokeVideos, (item) => {
          const title = String(item?.title || '').trim();
          if (!title) return null;
          return {
            title,
            provider: String(item?.provider || 'youtube').trim(),
            videoId: String(item?.videoId || '').trim(),
            poster: item?.poster || '',
            url: String(item?.url || '').trim()
          };
        });
      }
      if (req.body.bespokeNews !== undefined) {
        bespokePage.news = normalizeEditableArray(req.body.bespokeNews, (item) => {
          const title = String(item?.title || '').trim();
          if (!title) return null;
          return {
            title,
            date: String(item?.date || '').trim(),
            readTime: String(item?.readTime || '').trim(),
            image: item?.image || '',
            excerpt: String(item?.excerpt || '').trim(),
            body: String(item?.body || '').trim()
          };
        });
      }

      const bespokeFiles = req.files || {};
      bespokePage.solutions = await uploadIndexedBespokeFiles(bespokeFiles, 'bespokeSolutionImage', bespokePage.solutions || [], 'image', currentBespoke.solutions || [], 'image', currentUserId);
      bespokePage.collections = await uploadIndexedBespokeFiles(bespokeFiles, 'bespokeCollectionImage', bespokePage.collections || [], 'image', currentBespoke.collections || [], 'image', currentUserId);
      bespokePage.catalogs = await uploadIndexedBespokeFiles(bespokeFiles, 'bespokeCatalogCover', bespokePage.catalogs || [], 'cover', currentBespoke.catalogs || [], 'cover', currentUserId);
      bespokePage.catalogs = await uploadIndexedBespokeFiles(bespokeFiles, 'bespokeCatalogFile', bespokePage.catalogs || [], 'file', currentBespoke.catalogs || [], 'file', currentUserId);
      bespokePage.videos = await uploadIndexedBespokeFiles(bespokeFiles, 'bespokeVideoPoster', bespokePage.videos || [], 'poster', currentBespoke.videos || [], 'poster', currentUserId);
      bespokePage.news = await uploadIndexedBespokeFiles(bespokeFiles, 'bespokeNewsImage', bespokePage.news || [], 'image', currentBespoke.news || [], 'image', currentUserId);

      const heroImage = await uploadSingleBespokeImage('bespokeHeroImage', currentBespoke.heroImage);
      if (heroImage !== undefined) bespokePage.heroImage = heroImage;

      const customImage = await uploadSingleBespokeImage('bespokeCustomImage', currentBespoke.customImage);
      if (customImage !== undefined) bespokePage.customImage = customImage;

      let galleryMedia = Array.isArray(currentBespoke.galleryMedia) ? [...currentBespoke.galleryMedia] : [];
      if (req.body.bespokeExistingGalleryMedia !== undefined) {
        const parsedExisting = parseMaybeJson(req.body.bespokeExistingGalleryMedia, []);
        galleryMedia = Array.isArray(parsedExisting) ? parsedExisting : [];
      }

      if (req.files?.bespokeGalleryMedia) {
        const uploadResults = await s3Upload(currentUserId || 'admin', req.files.bespokeGalleryMedia, 'brands');
        galleryMedia = [...galleryMedia, ...uploadResults].slice(0, 8);
      }

      bespokePage.galleryMedia = galleryMedia.slice(0, 8);

      // FIX: customImage is stored as a SEPARATE field from galleryMedia.
      // The frontend merges both into one list, so if the user removes customImage
      // we must explicitly clear it here — otherwise it reappears on every reload.
      if (currentBespoke.customImage && req.body.bespokeExistingGalleryMedia !== undefined) {
        const customPublicId = currentBespoke.customImage?.public_id || currentBespoke.customImage;
        const stillPresent = galleryMedia.some(
          (m) => (m?.public_id || m?.secure_url || m) === customPublicId ||
                 (m?.secure_url && currentBespoke.customImage?.secure_url && m.secure_url === currentBespoke.customImage.secure_url)
        );
        if (!stillPresent) {
          bespokePage.customImage = null;
          // Clean up orphaned S3 file
          if (currentBespoke.customImage?.public_id) {
            s3Delete(currentBespoke.customImage.public_id).catch((err) =>
              console.error('S3 cleanup error for removed customImage:', err)
            );
          }
        }
      }

      updateObj.bespokePage = bespokePage;
    }

    const updatedbrand = await Brand.findByIdAndUpdate(req.params.id, updateObj, { new: true, runValidators: true });

    if (!updatedbrand) return fail(res, new Error('brand not found'), 404);

    return success(res, updatedbrand, 200);
  } catch (err) {
    console.error('updatebrand error:', err);
    return fail(res, err, 422);
  }
};

export default updatebrand;
