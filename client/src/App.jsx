// ============================================================
// SynapseAI — Main App Component (v3 — Apple Design Language)
// Clean translucent glass navbar, minimal & reductive UI
// ============================================================

import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Code2,
  Heart,
  GraduationCap,
  Cpu,
  Menu,
  X,
  Settings,
  Server,
  Cloud,
} from 'lucide-react';
import { getStatus, getSettings } from './services/api';
import SettingsModal from './components/SettingsModal';
import Dashboard from './pages/Dashboard';
import ChatPage from './pages/ChatPage';
import SummarizerPage from './pages/SummarizerPage';
import CodeReviewPage from './pages/CodeReviewPage';
import SentimentPage from './pages/SentimentPage';
import LearnAIPage from './pages/LearnAIPage';
import './App.css';

function AppLayout() {
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [modelName, setModelName] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(getSettings().provider || 'local');
  const location = useLocation();

  // Check Ollama status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await getStatus();
        setOllamaOnline(res.data.ollama.online);
        setModelName(res.data.ollama.defaultModel);
      } catch {
        setOllamaOnline(false);
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll detection for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/chat', icon: <MessageSquare size={18} />, label: 'Chat' },
    { to: '/summarizer', icon: <FileText size={18} />, label: 'Summarizer' },
    { to: '/code-review', icon: <Code2 size={18} />, label: 'Code Review' },
    { to: '/sentiment', icon: <Heart size={18} />, label: 'Sentiment' },
    { to: '/learn', icon: <GraduationCap size={18} />, label: 'Learn AI' },
  ];

  return (
    <div className="app-layout">
      {/* Apple Glass Navbar */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Brand */}
          <div className="navbar-brand">
            <div className="navbar-logo">
              <span className="logo-icon">⚡</span>
            </div>
            <span className="navbar-brand-text">SynapseAI</span>
          </div>

          {/* Desktop Nav Links (text only, Apple style) */}
          <div className="navbar-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right Section */}
          <div className="navbar-right">
            {/* Provider Badge */}
            <div className="model-badge">
              {currentProvider === 'groq' ? <Cloud size={11} /> : <Server size={11} />}
              <span>{currentProvider === 'groq' ? 'Groq' : 'Local'}</span>
            </div>

            <div className={`status-indicator ${ollamaOnline ? 'online' : 'offline'}`}>
              <span className="status-dot" />
              <span className="status-text">{ollamaOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* Settings Button */}
            <button
              className="settings-btn"
              onClick={() => setSettingsOpen(true)}
              title="Settings"
            >
              <Settings size={16} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/summarizer" element={<SummarizerPage />} />
          <Route path="/code-review" element={<CodeReviewPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="/learn" element={<LearnAIPage />} />
        </Routes>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={(s) => setCurrentProvider(s.provider)}
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
