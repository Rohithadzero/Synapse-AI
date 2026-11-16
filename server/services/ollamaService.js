// ============================================================
// SynapseAI — Ollama Service
// Handles all communication with the local Ollama LLM
// ============================================================

import { readLines, throwUpstreamError } from './streamUtils.js';

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

/**
 * fetch() wrapper that turns "connection refused" into a clear, user-facing error
 */
async function ollamaFetch(path, options) {
  try {
    return await fetch(`${OLLAMA_BASE}${path}`, options);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    const e = new Error(`Cannot reach Ollama at ${OLLAMA_BASE}. Is it running? (ollama serve)`);
    e.statusCode = 503;
    throw e;
  }
}

/**
 * Check if Ollama is running and accessible
 * @returns {Promise<Object>} Status info including available models
 */
export async function checkOllamaStatus() {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) throw new Error('Ollama not responding');
    const data = await res.json();
    return {
      online: true,
      models: data.models || [],
      defaultModel: DEFAULT_MODEL,
      baseUrl: OLLAMA_BASE,
    };
  } catch (err) {
    return {
      online: false,
      models: [],
      defaultModel: DEFAULT_MODEL,
      baseUrl: OLLAMA_BASE,
      error: err.message,
    };
  }
}

/**
 * Send a non-streaming request to Ollama
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - The system prompt for role/context
 * @param {string} model - Model name (defaults to env config)
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<string>} The model's response text
 */
export async function generateResponse(prompt, systemPrompt = '', model = DEFAULT_MODEL, { signal } = {}) {
  const res = await ollamaFetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, system: systemPrompt, stream: false }),
    signal,
  });

  if (!res.ok) await throwUpstreamError(res, 'Ollama');

  const data = await res.json();
  return data.response;
}

/**
 * Start a streaming chat request (with message history).
 * Resolves once Ollama has accepted the request, so connection/model errors
 * surface before any SSE headers are sent.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<AsyncGenerator<string>>} token iterator
 */
export async function openChatStream(messages, model = DEFAULT_MODEL, { signal } = {}) {
  const res = await ollamaFetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok) await throwUpstreamError(res, 'Ollama');

  return (async function* tokens() {
    // Ollama streams newline-delimited JSON objects
    for await (const line of readLines(res.body)) {
      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue; // skip malformed lines
      }
      if (parsed.error) throw new Error(`Ollama error: ${parsed.error}`);
      if (parsed.message?.content) yield parsed.message.content;
      if (parsed.done) return;
    }
  })();
}
