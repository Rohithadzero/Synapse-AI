// ============================================================
// SynapseAI — Settings Modal Component
// Provider toggle: Local LLM (Ollama) vs Groq Cloud API
// ============================================================

import { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Server,
  Cloud,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { getSettings, saveSettings, getModels, testConnection } from '../services/api';

const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile' },
];

export default function SettingsModal({ isOpen, onClose, onSettingsChange }) {
  const [provider, setProvider] = useState('local');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [localModels, setLocalModels] = useState([]);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('');

  // Load saved settings on mount
  useEffect(() => {
    if (isOpen) {
      const saved = getSettings();
      setProvider(saved.provider || 'local');
      setApiKey(saved.apiKey || '');
      setModel(saved.model || '');
      setTestStatus(null);
      setTestMessage('');
      loadLocalModels();
    }
  }, [isOpen]);

  // Load local Ollama models
  const loadLocalModels = async () => {
    try {
      const res = await getModels('local');
      setLocalModels(res.data || []);
    } catch {
      setLocalModels([]);
    }
  };

  // Test connection
  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      const res = await testConnection(provider, apiKey);
      if (res.data?.online) {
        setTestStatus('success');
        setTestMessage(`Connected successfully${provider === 'local' ? ` — ${res.data.models?.length || 0} models available` : ''}`);
      } else {
        setTestStatus('error');
        setTestMessage(res.data?.error || 'Connection failed');
      }
    } catch (err) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection failed');
    }
  };

  // Save settings
  const handleSave = () => {
    const settings = { provider, apiKey, model };
    saveSettings(settings);
    onSettingsChange?.(settings);
    onClose();
  };

  if (!isOpen) return null;

  const currentModels = provider === 'local' ? localModels : GROQ_MODELS;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-left">
            <Settings size={18} />
            <h3>Settings</h3>
          </div>
          <button className="settings-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Provider Toggle */}
        <div className="settings-section">
          <label className="settings-label">AI Provider</label>
          <div className="provider-toggle">
            <button
              className={`provider-option ${provider === 'local' ? 'active' : ''}`}
              onClick={() => { setProvider('local'); setModel(''); setTestStatus(null); }}
            >
              <Server size={16} />
              <span>Local LLM</span>
            </button>
            <button
              className={`provider-option ${provider === 'groq' ? 'active' : ''}`}
              onClick={() => { setProvider('groq'); setModel(''); setTestStatus(null); }}
            >
              <Cloud size={16} />
              <span>Groq Cloud</span>
            </button>
          </div>
          <p className="settings-hint">
            {provider === 'local'
              ? 'Run AI models locally via Ollama. No internet required, complete privacy.'
              : 'Use Groq\'s fast cloud inference. Free tier available at console.groq.com.'}
          </p>
        </div>

        {/* API Key (Groq only) */}
        {provider === 'groq' && (
          <div className="settings-section">
            <label className="settings-label">API Key</label>
            <div className="api-key-input-wrapper">
              <input
                type={showKey ? 'text' : 'password'}
                className="settings-input"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setTestStatus(null); }}
                placeholder="gsk_..."
                autoComplete="off"
              />
              <button
                className="key-toggle"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="settings-hint">
              Your key is stored locally in your browser. Never sent to our server for storage.
            </p>
          </div>
        )}

        {/* Model Selection */}
        <div className="settings-section">
          <label className="settings-label">Model</label>
          <div className="select-wrapper">
            <select
              className="settings-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="">Default</option>
              {currentModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-chevron" />
          </div>
          {provider === 'local' && localModels.length === 0 && (
            <p className="settings-hint" style={{ color: 'var(--warning)' }}>
              No local models found. Make sure Ollama is running.
            </p>
          )}
        </div>

        {/* Test Connection */}
        <div className="settings-section">
          <button
            className="btn btn-secondary settings-test-btn"
            onClick={handleTest}
            disabled={testStatus === 'testing' || (provider === 'groq' && !apiKey)}
          >
            {testStatus === 'testing' ? (
              <>
                <span className="loader loader-sm"></span>
                Testing...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
          {testStatus === 'success' && (
            <div className="test-result success">
              <Check size={14} />
              <span>{testMessage}</span>
            </div>
          )}
          {testStatus === 'error' && (
            <div className="test-result error">
              <AlertCircle size={14} />
              <span>{testMessage}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
