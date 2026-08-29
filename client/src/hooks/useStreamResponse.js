// ============================================================
// SynapseAI — useStreamResponse Hook
// Custom React hook for handling SSE streaming responses
// ============================================================

import { useState, useCallback, useRef } from 'react';

export function useStreamResponse() {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(null);

  const startStream = useCallback((streamFn) => {
    setResponse('');
    setIsStreaming(true);

    const abort = streamFn(
      // onToken
      (token) => {
        setResponse((prev) => prev + token);
      },
      // onDone
      () => {
        setIsStreaming(false);
      },
      // onError
      (err) => {
        setIsStreaming(false);
        console.error('Stream error:', err);
      }
    );

    abortRef.current = abort;
  }, []);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      setIsStreaming(false);
    }
  }, []);

  const resetResponse = useCallback(() => {
    setResponse('');
    setIsStreaming(false);
  }, []);

  return { response, isStreaming, startStream, stopStream, resetResponse };
}
