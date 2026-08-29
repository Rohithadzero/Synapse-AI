// ============================================================
// SynapseAI — Sentiment Analysis Routes
// ============================================================

import { Router } from 'express';
import { analyzeSentiment, getSentimentHistory } from '../controllers/sentimentController.js';

const router = Router();

router.post('/', analyzeSentiment);
router.get('/history', getSentimentHistory);

export default router;
