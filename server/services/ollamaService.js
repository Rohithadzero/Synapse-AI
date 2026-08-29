// ============================================================
// SynapseAI — Ollama Service
// Handles all communication with the local Ollama LLM
// ============================================================

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

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
 * @returns {Promise<string>} The model's response text
 */
export async function generateResponse(prompt, systemPrompt = '', model = DEFAULT_MODEL) {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Send a streaming request to Ollama and pipe tokens to an SSE response
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - System prompt
 * @param {import('express').Response} res - Express response object for SSE
 * @param {string} model - Model name
 */
export async function streamResponse(prompt, systemPrompt = '', res, model = DEFAULT_MODEL) {
  const ollamaRes = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system: systemPrompt,
      stream: true,
    }),
  });

  if (!ollamaRes.ok) {
    const errText = await ollamaRes.text();
    throw new Error(`Ollama error (${ollamaRes.status}): ${errText}`);
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let fullResponse = '';

  // Read the stream
  const reader = ollamaRes.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      // Ollama sends newline-delimited JSON
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            fullResponse += parsed.response;
            // Send each token as an SSE event
            res.write(`data: ${JSON.stringify({ token: parsed.response, done: false })}\n\n`);
          }
          if (parsed.done) {
            res.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse })}\n\n`);
          }
        } catch (parseErr) {
          // Skip malformed lines
        }
      }
    }
  } catch (streamErr) {
    res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
  } finally {
    res.end();
  }

  return fullResponse;
}

/**
 * Chat with Ollama using the chat endpoint (with message history)
 * @param {Array} messages - Array of {role, content} messages
 * @param {import('express').Response} res - Express response for SSE
 * @param {string} model - Model name
 */
export async function streamChat(messages, res, model = DEFAULT_MODEL) {
  const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!ollamaRes.ok) {
    const errText = await ollamaRes.text();
    throw new Error(`Ollama error (${ollamaRes.status}): ${errText}`);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let fullResponse = '';
  const reader = ollamaRes.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(l => l.trim());

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            fullResponse += parsed.message.content;
            res.write(`data: ${JSON.stringify({ token: parsed.message.content, done: false })}\n\n`);
          }
          if (parsed.done) {
            res.write(`data: ${JSON.stringify({ token: '', done: true, fullResponse })}\n\n`);
          }
        } catch (parseErr) {
          // Skip malformed lines
        }
      }
    }
  } catch (streamErr) {
    res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
  } finally {
    res.end();
  }

  return fullResponse;
}
