// ============================================================
// SynapseAI — Unified LLM Service
// Routes requests to either local Ollama or Groq Cloud API
// based on per-request options passed via headers
// ============================================================

import { checkOllamaStatus, generateResponse as ollamaGenerate, streamChat as ollamaStreamChat } from './ollamaService.js';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';

// ── Available Groq models ──────────────────────────────────
const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', context: 131072 },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', context: 131072 },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', context: 8192 },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', context: 32768 },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', context: 131072 },
];

// ── Groq: non-streaming generate ────────────────────────────
async function groqGenerate(prompt, systemPrompt, apiKey, model = 'llama-3.3-70b-versatile') {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    throw new Error(`Groq API error: ${err.error?.message || res.status}`);
  }

  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

// ── Groq: streaming chat ────────────────────────────────────
async function groqStreamChat(messages, expressRes, apiKey, model = 'llama-3.3-70b-versatile') {
  const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
    throw new Error(`Groq API error: ${err.error?.message || res.status}`);
  }

  // Set up SSE headers
  expressRes.setHeader('Content-Type', 'text/event-stream');
  expressRes.setHeader('Cache-Control', 'no-cache');
  expressRes.setHeader('Connection', 'keep-alive');
  expressRes.setHeader('X-Accel-Buffering', 'no');

  let fullResponse = '';
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep the incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          expressRes.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse })}\n\n`);
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            expressRes.write(`data: ${JSON.stringify({ token: content, done: false })}\n\n`);
          }
        } catch (parseErr) {
          // Skip malformed lines
        }
      }
    }
  } catch (streamErr) {
    expressRes.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
  } finally {
    expressRes.end();
  }

  return fullResponse;
}

// ── Groq: check status ──────────────────────────────────────
async function checkGroqStatus(apiKey) {
  try {
    const res = await fetch(`${GROQ_API_BASE}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Groq API returned ${res.status}`);
    const data = await res.json();
    return {
      online: true,
      models: GROQ_MODELS,
      defaultModel: 'llama-3.3-70b-versatile',
      provider: 'groq',
    };
  } catch (err) {
    return {
      online: false,
      models: [],
      defaultModel: 'llama-3.3-70b-versatile',
      provider: 'groq',
      error: err.message,
    };
  }
}

// ============================================================
// PUBLIC API — Unified interface used by all controllers
// ============================================================

/**
 * Extract LLM options from request headers
 * Attach as req.llm for controllers to use
 */
export function extractLLMOptions(req) {
  return {
    provider: req.headers['x-ai-provider'] || 'local',
    apiKey: req.headers['x-api-key'] || '',
    model: req.headers['x-model'] || '',
  };
}

/**
 * Non-streaming text generation (summarize, code review, sentiment)
 */
export async function generateResponse(prompt, systemPrompt, options = {}) {
  const { provider = 'local', apiKey, model } = options;

  if (provider === 'groq') {
    if (!apiKey) throw new Error('Groq API key is required');
    return groqGenerate(prompt, systemPrompt, apiKey, model || 'llama-3.3-70b-versatile');
  }

  // Default: local Ollama
  return ollamaGenerate(prompt, systemPrompt, model || undefined);
}

/**
 * Streaming chat with message history
 */
export async function streamChat(messages, res, options = {}) {
  const { provider = 'local', apiKey, model } = options;

  if (provider === 'groq') {
    if (!apiKey) throw new Error('Groq API key is required');
    return groqStreamChat(messages, res, apiKey, model || 'llama-3.3-70b-versatile');
  }

  // Default: local Ollama
  return ollamaStreamChat(messages, res, model || undefined);
}

/**
 * Check provider status/connectivity
 */
export async function getProviderStatus(options = {}) {
  const { provider = 'local', apiKey } = options;

  if (provider === 'groq') {
    return checkGroqStatus(apiKey);
  }

  return checkOllamaStatus();
}

/**
 * Get available models for a provider
 */
export function getAvailableModels(provider = 'local') {
  if (provider === 'groq') {
    return GROQ_MODELS;
  }
  // For local, models come from checkOllamaStatus()
  return [];
}
