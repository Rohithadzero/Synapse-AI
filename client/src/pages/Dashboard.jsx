// ============================================================
// SynapseAI — Dashboard Page (v3 — Apple Design Language)
// Clean hero, minimal stats, product-card style tool grid
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  Code2,
  Heart,
  ArrowRight,
  Cpu,
  Activity,
  Database,
  Zap,
} from 'lucide-react';
import { getStatus } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await getStatus();
        setStatus(res.data);
      } catch (err) {
        console.error('Failed to fetch status:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  const stats = status?.stats || {};
  const ollama = status?.ollama || {};

  const tools = [
    {
      icon: <MessageSquare size={22} />,
      title: 'AI Chat',
      desc: 'Have a conversation with your local AI. Ask questions, brainstorm ideas, or get help with any topic.',
      path: '/chat',
    },
    {
      icon: <FileText size={22} />,
      title: 'Smart Summarizer',
      desc: 'Paste any article, document, or text and get an intelligent AI-powered summary in seconds.',
      path: '/summarizer',
    },
    {
      icon: <Code2 size={22} />,
      title: 'Code Reviewer',
      desc: 'Get AI-powered code review with bug detection, performance tips, and best practice suggestions.',
      path: '/code-review',
    },
    {
      icon: <Heart size={22} />,
      title: 'Sentiment Analyzer',
      desc: 'Analyze the emotional tone and sentiment of any text — reviews, emails, social media posts.',
      path: '/sentiment',
    },
  ];

  return (
    <div className="dashboard">
      {/* Hero Section — Clean black background, no orbs */}
      <div className="dashboard-hero">
        <h2>
          Welcome to <span className="hero-accent">SynapseAI</span>
        </h2>
        <p>
          Your private, AI-powered content intelligence platform.
          All processing happens locally — zero API costs, complete privacy.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card stagger-1">
          <div className="stat-icon purple">
            <MessageSquare size={20} />
          </div>
          <div className="stat-info">
            <h3>{stats.conversations || 0}</h3>
            <span>Conversations</span>
          </div>
        </div>

        <div className="stat-card stagger-2">
          <div className="stat-icon cyan">
            <FileText size={20} />
          </div>
          <div className="stat-info">
            <h3>{stats.summaries || 0}</h3>
            <span>Summaries</span>
          </div>
        </div>

        <div className="stat-card stagger-3">
          <div className="stat-icon green">
            <Code2 size={20} />
          </div>
          <div className="stat-info">
            <h3>{stats.codeReviews || 0}</h3>
            <span>Code Reviews</span>
          </div>
        </div>

        <div className="stat-card stagger-4">
          <div className="stat-icon amber">
            <Heart size={20} />
          </div>
          <div className="stat-info">
            <h3>{stats.sentimentAnalyses || 0}</h3>
            <span>Analyses</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      {!loading && (
        <div className="stats-grid" style={{ marginBottom: 'var(--space-48)' }}>
          <div className="stat-card">
            <div className="stat-icon purple">
              <Cpu size={20} />
            </div>
            <div className="stat-info">
              <h3 style={{ fontSize: 'var(--text-body)' }}>
                {ollama.online ? ollama.defaultModel : 'Offline'}
              </h3>
              <span>AI Model</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon cyan">
              <Activity size={20} />
            </div>
            <div className="stat-info">
              <h3 style={{ fontSize: 'var(--text-body)', color: ollama.online ? 'var(--success)' : 'var(--danger)' }}>
                {ollama.online ? 'Connected' : 'Disconnected'}
              </h3>
              <span>Ollama Status</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">
              <Database size={20} />
            </div>
            <div className="stat-info">
              <h3 style={{ fontSize: 'var(--text-body)' }}>
                {ollama.models?.length || 0} Models
              </h3>
              <span>Available</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">
              <Zap size={20} />
            </div>
            <div className="stat-info">
              <h3 style={{ fontSize: 'var(--text-body)' }}>100% Local</h3>
              <span>Privacy</span>
            </div>
          </div>
        </div>
      )}

      {/* Tools Grid */}
      <h3 className="tools-section-title">
        <Zap size={20} />
        AI Tools
      </h3>
      <div className="tools-grid">
        {tools.map((tool, i) => (
          <div
            key={tool.path}
            className={`tool-card stagger-${i + 1}`}
            onClick={() => navigate(tool.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(tool.path)}
          >
            <div className="tool-card-icon">{tool.icon}</div>
            <h3>{tool.title}</h3>
            <p>{tool.desc}</p>
            <div className="tool-card-arrow">
              <ArrowRight size={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
