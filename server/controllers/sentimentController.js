// ============================================================
// SynapseAI — Sentiment Analysis Controller
// AI-powered emotional tone and sentiment detection
// ============================================================

import { generateResponse } from '../services/llmService.js';
import { addRecord, readAll } from '../services/storageService.js';

const SENTIMENT_PROMPT = `You are a sentiment and emotional tone analyzer. Analyze the given text and respond with ONLY a valid JSON object (no markdown, no code fences, no extra text). Use this exact structure:

{
  "sentiment": "positive" | "negative" | "neutral" | "mixed",
  "confidence": 0.0 to 1.0,
  "emotions": {
    "joy": 0.0 to 1.0,
    "sadness": 0.0 to 1.0,
    "anger": 0.0 to 1.0,
    "fear": 0.0 to 1.0,
    "surprise": 0.0 to 1.0,
    "trust": 0.0 to 1.0
  },
  "tone": "formal" | "informal" | "professional" | "casual" | "emotional" | "academic",
  "summary": "One sentence summary of the emotional tone"
}

Respond with ONLY the JSON object, nothing else.`;

/**
 * POST /api/sentiment — Analyze sentiment
 * Body: { text: string }
 */
export async function analyzeSentiment(req, res, next) {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    const prompt = `Analyze the sentiment and emotional tone of this text:\n\n"${text}"`;

    // Uses req.llm options to route to correct provider
    const rawResponse = await generateResponse(prompt, SENTIMENT_PROMPT, req.llm);

    // Parse the JSON response from the LLM
    let analysis;
    try {
      // Try to extract JSON from the response (LLM might add extra text)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseErr) {
      // Fallback: return raw response if JSON parsing fails
      analysis = {
        sentiment: 'unknown',
        confidence: 0,
        emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0, trust: 0 },
        tone: 'unknown',
        summary: rawResponse.slice(0, 200),
        parseError: true,
      };
    }

    // Save to history
    const record = await addRecord('sentimentAnalyses', {
      text: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
      analysis,
      wordCount: text.split(/\s+/).length,
    });

    res.json({
      success: true,
      data: {
        analysis,
        wordCount: text.split(/\s+/).length,
        id: record.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sentiment/history — Get sentiment analysis history
 */
export async function getSentimentHistory(req, res, next) {
  try {
    const analyses = await readAll('sentimentAnalyses');
    const sorted = analyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sorted });
  } catch (err) {
    next(err);
  }
}
