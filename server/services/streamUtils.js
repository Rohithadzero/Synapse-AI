// ============================================================
// SynapseAI — Streaming Utilities
// Shared helpers for reading upstream LLM streams and relaying
// tokens to the browser as Server-Sent Events (SSE)
// ============================================================

/**
 * Read a fetch Response body line by line.
 * Network chunks can split a line in half, so the incomplete tail
 * is buffered until the rest of it arrives.
 * @param {ReadableStream<Uint8Array>} body
 * @returns {AsyncGenerator<string>} non-empty, trimmed lines
 */
export async function* readLines(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep the incomplete line for the next chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) yield trimmed;
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) yield buffer.trim();
  } finally {
    reader.releaseLock();
  }
}

function writeEvent(res, payload) {
  if (!res.writableEnded) res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * Relay an async iterator of text tokens to an Express response as SSE.
 * Events: { token, done:false } per token, then { token:'', done:true, fullResponse },
 * or { error } if the upstream stream fails.
 *
 * @param {AsyncIterable<string>} tokens
 * @param {import('express').Response} res
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ fullResponse: string, completed: boolean, aborted: boolean }>}
 */
export async function pipeTokensToSSE(tokens, res, { signal } = {}) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let fullResponse = '';
  let completed = false;

  try {
    for await (const token of tokens) {
      if (signal?.aborted) break;
      if (!token) continue;
      fullResponse += token;
      writeEvent(res, { token, done: false });
    }
    if (!signal?.aborted) {
      completed = true;
      writeEvent(res, { token: '', done: true, fullResponse });
    }
  } catch (err) {
    if (!signal?.aborted) {
      // undici reports a dropped upstream connection as a bare "terminated"
      const message = err.message === 'terminated'
        ? 'Connection to the AI provider was lost mid-response. Please try again.'
        : err.message;
      writeEvent(res, { error: message });
    }
  } finally {
    if (!res.writableEnded) res.end();
  }

  return { fullResponse, completed, aborted: Boolean(signal?.aborted) };
}

/**
 * Throw a descriptive error for a failed upstream HTTP response.
 * The error carries a statusCode so the error middleware can relay it.
 */
export async function throwUpstreamError(res, label) {
  let message = `HTTP ${res.status}`;
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      message = json.error?.message || json.error || text || message;
    } catch {
      message = text || message;
    }
  } catch {
    // ignore body read errors
  }
  const err = new Error(`${label} error: ${message}`);
  err.statusCode = res.status === 401 || res.status === 403 ? 401 : 502;
  throw err;
}
