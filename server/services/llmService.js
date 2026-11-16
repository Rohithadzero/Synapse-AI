// ============================================================
// SynapseAI — Unified LLM Service
// Routes requests to either local Ollama or Groq Cloud API
// based on per-request options passed via headers
// ============================================================

import {
  checkOllamaStatus,
  generateResponse as ollamaGenerate,
  openChatStream as ollamaOpenChatStream,
} from './ollamaService.js';
import { readLines, pipeTokensToSSE, throwUpstreamError } from './streamUtils.js';

const GROQ_API_BASE = 'https://api.groq.com/openai/v1';
const GROQ_DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// Used only when the live model list can't be fetched (no key / network error)
const GROQ_FALLBACK_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'llama-3.3-70b-versatile', context: 131072 },
  { id: 'llama-3.1-8b-instant', name: 'llama-3.1-8b-instant', context: 131072 },
];

// Groq also hosts speech, TTS and moderation models — hide those from the chat model picker
const NON_CHAT_MODEL = /whisper|tts|playai|guard|orpheus|prompt-guard/i;

function groqHeaders(apiKey) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
}

async function groqFetch(path, options) {
  try {
    return await fetch(`${GROQ_API_BASE}${path}`, options);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const e = new Error(`Cannot reach Groq API: ${err.message}`);
    e.statusCode = 503;
    throw e;
  }
}

function requireGroqKey(apiKey) {
  if (!apiKey) {
    const err = new Error('Groq API key is required. Add it in Settings.');
    err.statusCode = 400;
    throw err;
  }
}

// ── Groq: non-streaming generate ────────────────────────────
async function groqGenerate(prompt, systemPrompt, apiKey, model, { signal } = {}) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const res = await groqFetch('/chat/completions', {
    method: 'POST',
    headers: groqHeaders(apiKey),
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096, stream: false }),
    signal,
  });

  if (!res.ok) await throwUpstreamError(res, 'Groq API');

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Groq: streaming chat ────────────────────────────────────
async function groqOpenChatStream(messages, apiKey, model, { signal } = {}) {
  const res = await groqFetch('/chat/completions', {
    method: 'POST',
    headers: groqHeaders(apiKey),
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096, stream: true }),
    signal,
  });

  if (!res.ok) await throwUpstreamError(res, 'Groq API');

  return (async function* tokens() {
    // OpenAI-compatible SSE: "data: {...}" lines, terminated by "data: [DONE]"
    for await (const line of readLines(res.body)) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch {
        continue; // skip malformed lines
      }
      if (parsed.error) throw new Error(`Groq API error: ${parsed.error.message || parsed.error}`);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) yield content;
    }
  })();
}

// ── Groq: model list ────────────────────────────────────────
async function fetchGroqModels(apiKey) {
  const res = await groqFetch('/models', { headers: groqHeaders(apiKey) });
  if (!res.ok) await throwUpstreamError(res, 'Groq API');
  const { data = [] } = await res.json();
  return data
    .filter((m) => m.active !== false && !NON_CHAT_MODEL.test(m.id))
    .map((m) => ({ id: m.id, name: m.id, context: m.context_window }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ── Groq: check status ──────────────────────────────────────
async function checkGroqStatus(apiKey) {
  try {
    requireGroqKey(apiKey);
    const models = await fetchGroqModels(apiKey);
    return { online: true, models, defaultModel: GROQ_DEFAULT_MODEL, provider: 'groq' };
  } catch (err) {
    return { online: false, models: [], defaultModel: GROQ_DEFAULT_MODEL, provider: 'groq', error: err.message };
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
 * @param {string} prompt
 * @param {string} systemPrompt
 * @param {{ provider?: string, apiKey?: string, model?: string, signal?: AbortSignal }} [options]
 */
export async function generateResponse(prompt, systemPrompt, options = {}) {
  const { provider = 'local', apiKey, model, signal } = options;

  if (provider === 'groq') {
    requireGroqKey(apiKey);
    return groqGenerate(prompt, systemPrompt, apiKey, model || GROQ_DEFAULT_MODEL, { signal });
  }

  return ollamaGenerate(prompt, systemPrompt, model || undefined, { signal });
}

/**
 * Streaming chat with message history, relayed to the client as SSE.
 * Throws (before any SSE headers are written) if the provider rejects the request,
 * so callers can still send a normal JSON error response.
 * @returns {Promise<{ fullResponse: string, completed: boolean, aborted: boolean }>}
 */
export async function streamChat(messages, res, options = {}) {
  const { provider = 'local', apiKey, model, signal } = options;

  let tokens;
  if (provider === 'groq') {
    requireGroqKey(apiKey);
    tokens = await groqOpenChatStream(messages, apiKey, model || GROQ_DEFAULT_MODEL, { signal });
  } else {
    tokens = await ollamaOpenChatStream(messages, model || undefined, { signal });
  }

  return pipeTokensToSSE(tokens, res, { signal });
}

/**
 * Check provider status/connectivity
 */
export async function getProviderStatus(options = {}) {
  const { provider = 'local', apiKey } = options;
  if (provider === 'groq') return checkGroqStatus(apiKey);
  return checkOllamaStatus();
}

/**
 * Get available models for a provider.
 * For Groq, returns the live list when an API key is available, otherwise a small fallback list.
 */
export async function getAvailableModels(provider = 'local', apiKey = '') {
  if (provider === 'groq') {
    if (!apiKey) return GROQ_FALLBACK_MODELS;
    try {
      const models = await fetchGroqModels(apiKey);
      return models.length ? models : GROQ_FALLBACK_MODELS;
    } catch {
      return GROQ_FALLBACK_MODELS;
    }
  }
  const status = await checkOllamaStatus();
  return status.models.map((m) => ({ id: m.name, name: m.name, size: m.size }));
}
