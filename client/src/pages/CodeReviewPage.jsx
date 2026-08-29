// ============================================================
// SynapseAI — Code Review Page (v3 — Apple Design Language)
// AI-powered code analysis with structured feedback
// ============================================================

import { useState } from 'react';
import { Code2, Sparkles, FileCode } from 'lucide-react';
import { reviewCode } from '../services/api';
import Markdown from 'react-markdown';

const LANGUAGES = [
  'auto-detect',
  'javascript',
  'typescript',
  'python',
  'java',
  'c',
  'c++',
  'c#',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'html',
  'css',
  'sql',
  'bash',
];

export default function CodeReviewPage() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto-detect');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lineCount = code ? code.split('\n').length : 0;

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await reviewCode(code, language);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to review code. Is Ollama running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Code Reviewer</h2>
        <p>Paste your code and get AI-powered analysis for bugs, performance, security, and best practices.</p>
      </div>

      <div className="code-review-layout">
        {/* Input */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)' }}>
              <Code2 size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Code Input
            </span>
            <span style={{ fontSize: 'var(--text-micro)', color: 'rgba(255,255,255,0.36)' }}>
              {lineCount} lines
            </span>
          </div>
          <div className="card-body">
            <select
              className="language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang === 'auto-detect' ? 'Auto-detect Language' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                </option>
              ))}
            </select>
            <textarea
              className="textarea textarea-code"
              placeholder="// Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={12}
              spellCheck={false}
            />
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleReview}
              disabled={!code.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="loader loader-sm" style={{ borderTopColor: '#fff' }}></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Review Code
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)' }}>
              <FileCode size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Review Results
            </span>
            {result && (
              <span className="header-badge">
                {result.linesOfCode} lines analyzed
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
                <Code2 size={32} style={{ marginBottom: 'var(--space-12)', opacity: 0.4 }} />
                <p style={{ fontSize: 'var(--text-caption)' }}>Review results will appear here</p>
              </div>
            )}
            {loading && (
              <div className="loader-wrapper">
                <div className="loader"></div>
                <span className="loader-text">AI is reviewing your code...</span>
              </div>
            )}
            {result && (
              <div className="review-result">
                <Markdown>{result.review}</Markdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
