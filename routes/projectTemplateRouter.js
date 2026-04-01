import express from 'express';
import authenticateToken from '../middlewares/verifyToken.js';
import createTemplateFromProject from '../controllers/projectTemplate/createTemplateFromProject.js';
import getTemplates from '../controllers/projectTemplate/getTemplates.js';
import useTemplate from '../controllers/projectTemplate/useTemplate.js';
import deleteTemplate from '../controllers/projectTemplate/deleteTemplate.js';
import updateTemplate from '../controllers/projectTemplate/updateTemplate.js';
import getMoodboardTemplates from '../controllers/projectTemplate/getMoodboardTemplates.js';
import getMoodboardTemplateById from '../controllers/projectTemplate/getMoodboardTemplateById.js';
import updateMoodboardTemplate from '../controllers/projectTemplate/updateMoodboardTemplate.js';
import createEstimatedCostTemplate from '../controllers/projectTemplate/createEstimatedCostTemplate.js';
import updateEstimatedCostTemplate from '../controllers/projectTemplate/updateEstimatedCostTemplate.js';

const router = express.Router();

// All template routes are protected and typically for architects (or admins)
router.post('/create-from-project/:projectId', authenticateToken(['architect', 'admin']), createTemplateFromProject);
router.get('/', authenticateToken(['architect', 'admin']), getTemplates);
router.patch('/:templateId', authenticateToken(['architect', 'admin']), updateTemplate);
router.post('/use/:templateId', authenticateToken(['architect', 'admin']), useTemplate);
router.delete('/:templateId', authenticateToken(['architect', 'admin']), deleteTemplate);

// Specific template moodboard (space) management
router.get('/:templateId/spaces', authenticateToken(['architect', 'admin']), getMoodboardTemplates);
router.get('/spaces/:spaceId', authenticateToken(['architect', 'admin']), getMoodboardTemplateById);
router.patch('/spaces/:spaceId', authenticateToken(['architect', 'admin']), updateMoodboardTemplate);

// Specific template estimation management
router.post('/costs', authenticateToken(['architect', 'admin']), createEstimatedCostTemplate);
router.patch('/costs/:costId', authenticateToken(['architect', 'admin']), updateEstimatedCostTemplate);

export default router;
