// ============================================================
// SynapseAI — Summarize Controller
// AI-powered text summarization with multiple modes
// ============================================================

import { generateResponse } from '../services/llmService.js';
import { addRecord, readAll } from '../services/storageService.js';

const SUMMARY_PROMPTS = {
  brief: `You are a professional summarizer. Summarize the following text in 2-3 concise sentences. Focus on the key message and main takeaways. Output ONLY the summary, no preamble.`,

  detailed: `You are a professional summarizer. Provide a thorough summary of the following text. Include all key points, arguments, and conclusions. Structure your summary with clear paragraphs. Output ONLY the summary, no preamble.`,

  bullets: `You are a professional summarizer. Summarize the following text as a clear bulleted list. Each bullet should capture one key point or takeaway. Use markdown bullet points. Output ONLY the bullet points, no preamble.`,

  eli5: `You are a teacher explaining to a 5-year-old. Simplify the following text into very easy-to-understand language. Use simple words and short sentences. Add analogies where helpful. Output ONLY the simplified explanation, no preamble.`,
};

/**
 * POST /api/summarize — Summarize text
 * Body: { text: string, mode: 'brief' | 'detailed' | 'bullets' | 'eli5' }
 */
export async function summarizeText(req, res, next) {
  try {
    const { text, mode = 'brief' } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    if (!SUMMARY_PROMPTS[mode]) {
      return res.status(400).json({
        success: false,
        error: `Invalid mode. Choose from: ${Object.keys(SUMMARY_PROMPTS).join(', ')}`,
      });
    }

    const systemPrompt = SUMMARY_PROMPTS[mode];
    const prompt = `Here is the text to summarize:\n\n${text}`;

    // Uses req.llm options to route to correct provider
    const summary = await generateResponse(prompt, systemPrompt, req.llm);

    // Calculate stats
    const originalWords = text.split(/\s+/).length;
    const summaryWords = summary.split(/\s+/).length;
    const compressionRatio = Math.round((1 - summaryWords / originalWords) * 100);

    // Save to history
    const record = await addRecord('summaries', {
      originalText: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
      summary,
      mode,
      originalWords,
      summaryWords,
      compressionRatio,
    });

    res.json({
      success: true,
      data: {
        summary,
        stats: {
          originalWords,
          summaryWords,
          compressionRatio: `${compressionRatio}%`,
        },
        id: record.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/summarize/history — Get summarization history
 */
export async function getSummaryHistory(req, res, next) {
  try {
    const summaries = await readAll('summaries');
    const sorted = summaries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sorted });
  } catch (err) {
    next(err);
  }
}
