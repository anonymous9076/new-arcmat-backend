import express from 'express';
import authenticateToken from '../middlewares/verifyToken.js';
import {
    getFeaturedGallery,
    getArchitectsWithRenders,
    getArchitectRenders,
    addToFeaturedGallery,
    removeFromFeaturedGallery
} from '../controllers/inspirationGallery/inspirationGalleryController.js';

const router = express.Router();

router.get('/', getFeaturedGallery);

router.get('/architects', authenticateToken(['admin']), getArchitectsWithRenders);

router.get('/architects/:architectId/renders', authenticateToken(['admin']), getArchitectRenders);

router.post('/', authenticateToken(['admin']), addToFeaturedGallery);

router.delete('/:id', authenticateToken(['admin']), removeFromFeaturedGallery);

export default router;
