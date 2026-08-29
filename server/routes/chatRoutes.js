// ============================================================
// SynapseAI — Chat Routes
// ============================================================

import { Router } from 'express';
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  sendMessage,
} from '../controllers/chatController.js';

const router = Router();

router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/conversations/:id/message', sendMessage);

export default router;
