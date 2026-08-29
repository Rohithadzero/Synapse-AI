// ============================================================
// SynapseAI — API Service
// Centralized HTTP client for all backend communication
// Includes settings management for provider toggle
// ============================================================

const BASE_URL = 'http://localhost:5000/api';

// ── Settings (localStorage) ─────────────────────────────────
const SETTINGS_KEY = 'synapse-ai-settings';

const DEFAULT_SETTINGS = {
  provider: 'local',  // 'local' or 'groq'
  apiKey: '',
  model: '',          // empty = use default for the provider
};

/**
 * Get saved settings from localStorage
 */
export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Build LLM headers from current settings
 */
function getLLMHeaders() {
  const settings = getSettings();
  const headers = {};
  if (settings.provider) headers['x-ai-provider'] = settings.provider;
  if (settings.apiKey) headers['x-api-key'] = settings.apiKey;
  if (settings.model) headers['x-model'] = settings.model;
  return headers;
}

/**
 * Generic fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...getLLMHeaders(),       // Inject provider/key/model headers
      ...options.headers,       // Allow overrides
    },
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getLLMHeaders(),
      ...options.headers,
    },
  };

  const res = await fetch(url, config);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Status & Health ──────────────────────────────────────
export const getStatus = () => request('/status');
export const getHealth = () => request('/health');

// ── Settings ─────────────────────────────────────────────
export const getProviders = () => request('/settings/providers');
export const getModels = (provider) => request(`/settings/models/${provider}`);
export const testConnection = (provider, apiKey) =>
  request('/settings/test', {
    method: 'POST',
    body: JSON.stringify({ provider, apiKey }),
  });

// ── Chat ─────────────────────────────────────────────────
export const getConversations = () => request('/chat/conversations');
export const getConversation = (id) => request(`/chat/conversations/${id}`);
export const createConversation = (title) =>
  request('/chat/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
export const deleteConversation = (id) =>
  request(`/chat/conversations/${id}`, { method: 'DELETE' });

/**
 * Send a chat message and get streaming response via SSE
 * @param {string} conversationId
 * @param {string} message
 * @param {function} onToken - Called with each token as it arrives
 * @param {function} onDone - Called when streaming is complete
 * @param {function} onError - Called on error
 * @returns {function} abort function to cancel the stream
 */
export function sendChatMessage(conversationId, message, onToken, onDone, onError) {
  const controller = new AbortController();

  fetch(`${BASE_URL}/chat/conversations/${conversationId}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getLLMHeaders(),  // Inject provider headers for streaming too
    },
    body: JSON.stringify({ message }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Stream request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              onError?.(new Error(data.error));
              return;
            }
            if (data.token) {
              onToken(data.token);
            }
            if (data.done) {
              onDone?.(data.fullResponse);
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err);
      }
    });

  return () => controller.abort();
}

// ── Summarize ────────────────────────────────────────────
export const summarizeText = (text, mode) =>
  request('/summarize', {
    method: 'POST',
    body: JSON.stringify({ text, mode }),
  });
export const getSummaryHistory = () => request('/summarize/history');

// ── Code Review ──────────────────────────────────────────
export const reviewCode = (code, language) =>
  request('/code-review', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
export const getReviewHistory = () => request('/code-review/history');

// ── Sentiment ────────────────────────────────────────────
export const analyzeSentiment = (text) =>
  request('/sentiment', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
export const getSentimentHistory = () => request('/sentiment/history');
