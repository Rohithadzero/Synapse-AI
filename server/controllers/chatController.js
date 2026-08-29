// ============================================================
// SynapseAI — Chat Controller
// Handles AI chat with conversation history and streaming
// ============================================================

import { streamChat } from '../services/llmService.js';
import { readAll, addRecord, findById, updateRecord, deleteRecord } from '../services/storageService.js';

const SYSTEM_PROMPT = `You are SynapseAI, an intelligent, helpful, and friendly AI assistant. You provide clear, accurate, and well-structured responses. When answering:
- Use markdown formatting for better readability
- Provide code examples when relevant
- Be concise but thorough
- If you don't know something, say so honestly`;

/**
 * GET /api/chat/conversations — List all conversations
 */
export async function getConversations(req, res, next) {
  try {
    const conversations = await readAll('conversations');
    // Return sorted by most recent first, only metadata (not full messages)
    const summary = conversations
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(c => ({
        id: c.id,
        title: c.title,
        messageCount: c.messages?.length || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/chat/conversations/:id — Get a specific conversation with messages
 */
export async function getConversation(req, res, next) {
  try {
    const conversation = await findById('conversations', req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/conversations — Create a new conversation
 */
export async function createConversation(req, res, next) {
  try {
    const conversation = await addRecord('conversations', {
      title: req.body.title || 'New Conversation',
      messages: [],
    });
    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/chat/conversations/:id — Delete a conversation
 */
export async function deleteConversation(req, res, next) {
  try {
    const deleted = await deleteRecord('conversations', req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/chat/conversations/:id/message — Send a message and get streaming AI response
 */
export async function sendMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const conversation = await findById('conversations', req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // Add user message to history
    conversation.messages.push({ role: 'user', content: message });

    // Build messages array (including system prompt)
    const chatMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversation.messages,
    ];

    // Stream the AI response — uses req.llm options to route to correct provider
    const fullResponse = await streamChat(chatMessages, res, req.llm);

    // Save assistant response to conversation
    conversation.messages.push({ role: 'assistant', content: fullResponse });

    // Auto-generate title from first message if it's still default
    if (conversation.title === 'New Conversation' && conversation.messages.length === 2) {
      conversation.title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
    }

    await updateRecord('conversations', req.params.id, {
      messages: conversation.messages,
      title: conversation.title,
    });
  } catch (err) {
    // If headers already sent (during streaming), just log
    if (res.headersSent) {
      console.error('[Chat Stream Error]:', err.message);
    } else {
      next(err);
    }
  }
}
