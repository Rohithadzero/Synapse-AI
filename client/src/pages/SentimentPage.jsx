// ============================================================
// SynapseAI — Sentiment Analysis Page (v3 — Apple Design Language)
// AI-powered emotional tone detection with visual gauges
// ============================================================

import { useState } from 'react';
import { Heart, Sparkles, BarChart3 } from 'lucide-react';
import { analyzeSentiment } from '../services/api';

export default function SentimentPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await analyzeSentiment(text);
      setResult(res.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze. Is Ollama running?');
    } finally {
      setLoading(false);
    }
  };

  const analysis = result?.analysis;

  return (
    <div>
      <div className="page-header">
        <h2>Sentiment Analyzer</h2>
        <p>Analyze the emotional tone and sentiment of any text — reviews, emails, social media posts.</p>
      </div>

      <div className="sentiment-layout">
        {/* Input */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)' }}>
              <Heart size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Input Text
            </span>
            <span style={{ fontSize: 'var(--text-micro)', color: 'rgba(255,255,255,0.36)' }}>
              {wordCount} words
            </span>
          </div>
          <div className="card-body">
            <textarea
              className="textarea"
              placeholder={"Paste text to analyze its emotional tone...\n\nTry pasting a product review, an email, a tweet, or any text!"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
            />
          </div>
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!text.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="loader loader-sm" style={{ borderTopColor: '#fff' }}></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Analyze Sentiment
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)' }}>
              <BarChart3 size={14} style={{ verticalAlign: 'middle', marginRight: 8 }} />
              Analysis Results
            </span>
          </div>
          <div className="card-body">
            {error && (
              <div style={{ color: 'var(--danger)', padding: 'var(--space-16)', background: 'rgba(255,59,48,0.06)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-caption)' }}>
                {error}
              </div>
            )}
            {!result && !error && !loading && (
              <div style={{ textAlign: 'center', padding: 'var(--space-48)', color: 'rgba(255,255,255,0.25)' }}>
                <Heart size={32} style={{ marginBottom: 'var(--space-12)', opacity: 0.4 }} />
                <p style={{ fontSize: 'var(--text-caption)' }}>Analysis results will appear here</p>
              </div>
            )}
            {loading && (
              <div className="loader-wrapper">
                <div className="loader"></div>
                <span className="loader-text">AI is analyzing emotions...</span>
              </div>
            )}
            {analysis && (
              <div className="sentiment-gauge" style={{ animation: 'fadeIn 0.4s var(--ease-apple)' }}>
                {/* Main Sentiment Gauge */}
                <div className={`gauge-circle ${analysis.sentiment}`}>
                  <span className="gauge-label">{analysis.sentiment}</span>
                  <span className="gauge-confidence">
                    {Math.round((analysis.confidence || 0) * 100)}% confident
                  </span>
                </div>

                {/* Tone Badge */}
                {analysis.tone && (
                  <div className="tone-badge">
                    Tone: {analysis.tone}
                  </div>
                )}

                {/* Summary */}
                {analysis.summary && (
                  <p style={{ fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.56)', textAlign: 'center', maxWidth: 400, letterSpacing: '-0.224px' }}>
                    {analysis.summary}
                  </p>
                )}

                {/* Emotion Bars */}
                {analysis.emotions && (
                  <div className="emotion-bars">
                    <h4 style={{ fontSize: 'var(--text-caption)', fontWeight: 600, marginBottom: 'var(--space-8)', color: 'var(--text-on-dark)' }}>
                      Emotional Breakdown
                    </h4>
                    {Object.entries(analysis.emotions).map(([emotion, value]) => (
                      <div key={emotion} className="emotion-bar">
                        <span className="emotion-name">{emotion}</span>
                        <div className="emotion-track">
                          <div
                            className="emotion-fill"
                            style={{
                              width: `${Math.round((value || 0) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="emotion-value">
                          {Math.round((value || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
