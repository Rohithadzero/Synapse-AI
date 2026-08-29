// ============================================================
// SynapseAI — Express Server Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import chatRoutes from './routes/chatRoutes.js';
import summarizeRoutes from './routes/summarizeRoutes.js';
import codeReviewRoutes from './routes/codeReviewRoutes.js';
import sentimentRoutes from './routes/sentimentRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { checkOllamaStatus } from './services/ollamaService.js';
import { extractLLMOptions, getProviderStatus, getAvailableModels } from './services/llmService.js';
import { getStats } from './services/storageService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── LLM Options Middleware ───────────────────────────────────
// Extracts x-ai-provider, x-api-key, x-model from request headers
// and attaches them as req.llm for controllers to use
app.use((req, res, next) => {
  req.llm = extractLLMOptions(req);
  next();
});

// ── Health & Status Routes ───────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/status', async (req, res) => {
  const ollama = await checkOllamaStatus();
  const stats = await getStats();
  res.json({
    success: true,
    data: {
      server: { status: 'online', uptime: process.uptime() },
      ollama,
      stats,
    },
  });
});

// ── Settings Routes ──────────────────────────────────────────
// Available providers
app.get('/api/settings/providers', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'local',
        name: 'Local LLM (Ollama)',
        description: 'Run AI models locally on your machine. Requires Ollama to be installed and running.',
        requiresApiKey: false,
      },
      {
        id: 'groq',
        name: 'Groq Cloud',
        description: 'Use Groq\'s fast cloud inference. Free tier available. Get a key at console.groq.com.',
        requiresApiKey: true,
      },
    ],
  });
});

// Get models for a provider
app.get('/api/settings/models/:provider', async (req, res) => {
  const { provider } = req.params;
  if (provider === 'local') {
    const status = await checkOllamaStatus();
    return res.json({
      success: true,
      data: status.models?.map(m => ({ id: m.name, name: m.name, size: m.size })) || [],
    });
  }
  if (provider === 'groq') {
    return res.json({
      success: true,
      data: getAvailableModels('groq'),
    });
  }
  res.status(400).json({ success: false, error: 'Unknown provider' });
});

// Test provider connection
app.post('/api/settings/test', async (req, res) => {
  try {
    const options = {
      provider: req.body.provider || 'local',
      apiKey: req.body.apiKey || '',
    };
    const status = await getProviderStatus(options);
    res.json({ success: true, data: status });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/chat', chatRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/code-review', codeReviewRoutes);
app.use('/api/sentiment', sentimentRoutes);

// ── Error Handling ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🧠 SynapseAI Server                         ║
  ║   Running on http://localhost:${PORT}            ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});
