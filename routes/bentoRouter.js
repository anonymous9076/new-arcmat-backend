import express from 'express';
import authenticateToken from '../middlewares/verifyToken.js';
import getBentoItems from '../controllers/bento/getBento.js';
import updateBentoItem from '../controllers/bento/updateBento.js';
import createBentoItem from '../controllers/bento/createBento.js';
import deleteBentoItem from '../controllers/bento/deleteBento.js';
import upload from '../middlewares/imageUploader.js';

const router = express.Router();

router.get('/', getBentoItems);

router.post('/', authenticateToken(['admin']), upload.banner.fields([{ name: 'image', maxCount: 1 }]), createBentoItem);

router.put('/:id', authenticateToken(['admin']), upload.banner.fields([{ name: 'image', maxCount: 1 }]), updateBentoItem);

router.delete('/:id', authenticateToken(['admin']), deleteBentoItem);

export default router;
