// ============================================================
// SynapseAI — Code Review Routes
// ============================================================

import { Router } from 'express';
import { reviewCode, getReviewHistory } from '../controllers/codeReviewController.js';

const router = Router();

router.post('/', reviewCode);
router.get('/history', getReviewHistory);

export default router;
