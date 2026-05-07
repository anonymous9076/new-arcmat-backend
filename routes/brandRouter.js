import express from "express";
import upload from "../middlewares/imageUploader.js";
import createbrand from "../controllers/brand/createBrand.js";
import getBrandList from "../controllers/brand/getBrandList.js";
import productbybrand from "../controllers/brand/frontendProductByBrand.js";
import updatebrand from "../controllers/brand/updateBrand.js";
import deletebrand from "../controllers/brand/deleteBrand.js";
import brandsingle from "../controllers/brand/brandSingle.js";
import getBespokeOptions from "../controllers/brand/getBespokeOptions.js";
import {
  createContractorBespokeRequest,
  decideContractorBespokeRequest,
  listContractorBespokeRequests
} from "../controllers/brand/contractorBespokeRequests.js";
import authenticateToken from "../middlewares/verifyToken.js";

const router = express.Router()
const bespokeCardFileFields = Array.from({ length: 50 }, (_, index) => ([
  { name: `bespokeCollectionImage_${index}`, maxCount: 1 },
  { name: `bespokeCatalogCover_${index}`, maxCount: 1 },
  { name: `bespokeCatalogFile_${index}`, maxCount: 1 },
  { name: `bespokeVideoPoster_${index}`, maxCount: 1 },
  { name: `bespokeNewsImage_${index}`, maxCount: 1 },
  { name: `bespokeProjectMainImage_${index}`, maxCount: 1 },
  { name: `bespokeProjectGallery_${index}_0`, maxCount: 1 },
  { name: `bespokeProjectGallery_${index}_1`, maxCount: 1 },
  { name: `bespokeProjectGallery_${index}_2`, maxCount: 1 },
  { name: `bespokeProjectGallery_${index}_3`, maxCount: 1 },
])).flat();

router.post('/', authenticateToken(['admin', 'brand']), upload.brand.fields([
  { name: 'brand_image', maxCount: 1 },
]), createbrand);
router.get('/', getBrandList);
router.get('/products/:name', productbybrand);
router.get('/:id/bespoke-options', authenticateToken(['admin', 'brand']), getBespokeOptions);
router.post('/:id/contractor-requests', authenticateToken(['contractor']), createContractorBespokeRequest);
router.get('/:id/contractor-requests', authenticateToken(['admin', 'brand', 'contractor']), listContractorBespokeRequests);
router.patch('/:id/contractor-requests/:requestId', authenticateToken(['admin', 'brand']), decideContractorBespokeRequest);
router.get('/:id', brandsingle);
router.delete('/:id', authenticateToken(['admin']), deletebrand);
router.patch('/:id', authenticateToken(['admin', 'brand']), upload.brand.fields([
  { name: 'brand_image', maxCount: 1 },
  { name: 'bespokeHeroImage', maxCount: 1 },
  { name: 'bespokeCustomImage', maxCount: 1 },
  { name: 'bespokeGalleryMedia', maxCount: 8 },
  ...bespokeCardFileFields,
]), updatebrand);
export default router;
