// ============================================================
// SynapseAI — Chat Page (v3 — Apple Design Language)
// Full-featured AI chat with conversation sidebar and streaming
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Send,
  Trash2,
  MessageSquare,
  Bot,
  User,
  Square,
} from 'lucide-react';
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  sendChatMessage,
} from '../services/api';
import Markdown from 'react-markdown';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load a specific conversation
  const selectConversation = useCallback(async (id) => {
    try {
      const res = await getConversation(id);
      setActiveConvId(id);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Create new conversation
  const handleNewConversation = async () => {
    try {
      const res = await createConversation('New Conversation');
      await loadConversations();
      setActiveConvId(res.data.id);
      setMessages([]);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
      loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    // If no active conversation, create one
    let convId = activeConvId;
    if (!convId) {
      try {
        const res = await createConversation(input.slice(0, 50));
        convId = res.data.id;
        setActiveConvId(convId);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);
    setStreamingText('');

    const abort = sendChatMessage(
      convId,
      userMessage,
      // onToken
      (token) => {
        setStreamingText((prev) => prev + token);
      },
      // onDone
      (fullResponse) => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: fullResponse },
        ]);
        setStreamingText('');
        setIsStreaming(false);
        loadConversations();
      },
      // onError
      (err) => {
        console.error('Chat error:', err);
        setStreamingText('');
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${err.message}. Make sure Ollama is running.`,
          },
        ]);
      }
    );

    abortRef.current = abort;
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current();
      if (streamingText) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: streamingText + '\n\n*[Stopped]*' },
        ]);
      }
      setStreamingText('');
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-layout">
      {/* Conversation Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button className="btn btn-primary btn-sm" onClick={handleNewConversation} style={{ width: '100%' }}>
            <Plus size={14} /> New Chat
          </button>
        </div>
        <div className="chat-sidebar-list">
          {conversations.length === 0 ? (
            <div style={{ padding: 'var(--space-16)', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 'var(--text-micro)' }}>
              No conversations yet
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conv-item ${activeConvId === conv.id ? 'active' : ''}`}
                onClick={() => selectConversation(conv.id)}
              >
                <MessageSquare size={14} style={{ flexShrink: 0 }} />
                <span className="conv-item-title">{conv.title}</span>
                <button
                  className="conv-item-delete"
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  title="Delete conversation"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Main Area */}
      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 && !streamingText ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">⚡</div>
              <h3>Start a Conversation</h3>
              <p style={{ color: 'rgba(255,255,255,0.36)', maxWidth: 400, fontSize: 'var(--text-caption)' }}>
                Ask me anything. Powered by a local LLM running on your machine.
                Your data stays private.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                  </div>
                  <div className="message-content">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>
              ))}
              {streamingText && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <Bot size={15} />
                  </div>
                  <div className="message-content">
                    <Markdown>{streamingText}</Markdown>
                  </div>
                </div>
              )}
              {isStreaming && !streamingText && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <Bot size={15} />
                  </div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming}
            />
            {isStreaming ? (
              <button className="btn btn-secondary btn-icon" onClick={handleStop} title="Stop generating">
                <Square size={16} />
              </button>
            ) : (
              <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!input.trim()} title="Send message">
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
