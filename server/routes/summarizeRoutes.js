// ============================================================
// SynapseAI — Summarize Routes
// ============================================================

import { Router } from 'express';
import { summarizeText, getSummaryHistory } from '../controllers/summarizeController.js';

const router = Router();

router.post('/', summarizeText);
router.get('/history', getSummaryHistory);

export default router;
