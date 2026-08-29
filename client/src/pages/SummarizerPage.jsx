// ============================================================
// SynapseAI — Summarizer Page (v3 — Apple Design Language)
// AI-powered text summarization with multiple modes
// ============================================================

import { useState } from 'react';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import { summarizeText } from '../services/api';
import Markdown from 'react-markdown';

const MODES = [
  { id: 'brief', label: 'Brief', desc: '2-3 sentences' },
  { id: 'detailed', label: 'Detailed', desc: 'Full summary' },
  { id: 'bullets', label: 'Bullet Points', desc: 'Key takeaways' },
  { id: 'eli5', label: 'ELI5', desc: 'Simple explanation' },
];

export default function SummarizerPage() {
  const [text, setText] = useState('');
  const [mode, setMode] = useState('brief');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleSummarize = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await summarizeText(text, mode);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to summarize. Is Ollama running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Smart Summarizer</h2>
        <p>Paste any text and get an AI-powered summary. Choose your preferred format.</p>
      </div>

      {/* Mode Selector */}
      <div className="mode-selector">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${mode === m.id ? 'active' : ''}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="summarizer-layout">
        {/* Input */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)' }}>
              <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Input Text
            </span>
            <span style={{ fontSize: 'var(--text-micro)', color: 'rgba(255,255,255,0.36)' }}>
              {wordCount} words
            </span>
          </div>
          <div className="card-body">
            <textarea
              className="textarea"
              placeholder="Paste your article, document, or any text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
            />
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-micro)', color: 'rgba(255,255,255,0.36)' }}>
              Mode: {MODES.find(m => m.id === mode)?.desc}
            </span>
            <button
              className="btn btn-primary"
              onClick={handleSummarize}
              disabled={!text.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="loader loader-sm" style={{ borderTopColor: '#fff' }}></span>
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Summarize
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)' }}>
              <Sparkles size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Summary
            </span>
            {result && (
              <span className="header-badge">
                {result.stats.compressionRatio} reduced
              </span>
            )}
          </div>
          <div className="card-body">
            {error && (
              <div style={{ color: 'var(--danger)', padding: 'var(--space-16)', background: 'rgba(255,59,48,0.06)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-caption)' }}>
                {error}
              </div>
            )}
            {!result && !error && !loading && (
              <div style={{ textAlign: 'center', padding: 'var(--space-48)', color: 'rgba(255,255,255,0.25)' }}>
                <FileText size={32} style={{ marginBottom: 'var(--space-12)', opacity: 0.4 }} />
                <p style={{ fontSize: 'var(--text-caption)' }}>Your summary will appear here</p>
              </div>
            )}
            {loading && (
              <div className="loader-wrapper">
                <div className="loader"></div>
                <span className="loader-text">AI is analyzing your text...</span>
              </div>
            )}
            {result && (
              <>
                <div className="result-content">
                  <Markdown>{result.summary}</Markdown>
                </div>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="summary-stat-value">{result.stats.originalWords}</span>
                    <span className="summary-stat-label">Original</span>
                  </div>
                  <div className="summary-stat">
                    <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.25)', alignSelf: 'center' }} />
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-value">{result.stats.summaryWords}</span>
                    <span className="summary-stat-label">Summary</span>
                  </div>
                  <div className="summary-stat">
                    <span className="summary-stat-value">{result.stats.compressionRatio}</span>
                    <span className="summary-stat-label">Reduced</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
