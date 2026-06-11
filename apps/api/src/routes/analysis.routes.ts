import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import {
  uploadAnalysis,
  getJobStatus,
  getJobResults,
  getJobHistory,
  deleteJob,
} from '../controllers/analysis.controller';

const router = Router();

// Express routes for /api/analysis
router.post('/upload', requireAuth, upload.single('file'), uploadAnalysis);
router.get('/history', requireAuth, getJobHistory);
router.get('/:id/status', requireAuth, getJobStatus);
router.get('/:id/results', requireAuth, getJobResults);
router.delete('/:id', requireAuth, deleteJob);

export default router;
