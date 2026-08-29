<div align="center">

# 🧠 SynapseAI

### AI-Powered Content Intelligence Platform

*Summarize, analyze, review, and chat — powered by a local LLM, 100% private*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-FF6F00?style=flat-square)](https://ollama.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## ✨ What is SynapseAI?

SynapseAI is a **full-stack web application** that connects to a locally-hosted Large Language Model (LLM) via [Ollama](https://ollama.com) to provide AI-powered productivity tools — all running **entirely on your machine** with zero API costs and complete data privacy.

It demonstrates industry-standard patterns for building AI-integrated applications, including **streaming responses (SSE)**, **prompt engineering**, **structured AI outputs**, and a **modern React + Express architecture**.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 💬 **AI Chat** | ChatGPT-like conversational interface with real-time streaming responses, conversation history, and markdown support |
| 📝 **Smart Summarizer** | Paste any text → get AI summaries in 4 modes: Brief, Detailed, Bullet Points, or ELI5 (Explain Like I'm 5) |
| 🔍 **Code Reviewer** | AI-powered code analysis covering bugs, performance, security, and best practices with structured feedback |
| 💜 **Sentiment Analyzer** | Detect emotional tone and sentiment with visual gauges — confidence scores, emotion breakdowns, and tone classification |
| 🎓 **AI Learning Hub** | Interactive educational content: tokenizer demo, transformer architecture explainer, and prompt engineering guide |
| 📊 **Dashboard** | Overview with usage stats, system status, and quick-action cards |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** — Component-based UI (used by Meta, Netflix, Airbnb)
- **Vite** — Fast build tool and dev server
- **React Router v7** — Client-side routing
- **Lucide React** — Modern icon library
- **React Markdown** — Chat response rendering
- **Vanilla CSS** — Custom design system with CSS variables

### Backend
- **Node.js** — JavaScript runtime (used by Netflix, PayPal, LinkedIn)
- **Express.js** — HTTP framework for REST API
- **Ollama REST API** — Local LLM integration
- **Server-Sent Events (SSE)** — Real-time streaming responses

### AI
- **Ollama** — Local LLM runtime
- **Llama 3.1 8B** — Meta's open-source language model
- **Prompt Engineering** — Structured system prompts for each tool

---

## 📁 Project Structure

```
synapse-ai/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/             # 6 page components
│   │   ├── services/          # API client
│   │   ├── hooks/             # Custom React hooks
│   │   ├── App.jsx            # Root with routing & layout
│   │   ├── App.css            # Component styles
│   │   └── index.css          # Design system
│   └── package.json
│
├── server/                    # Express Backend
│   ├── controllers/           # Business logic
│   ├── routes/                # API routes
│   ├── services/              # Ollama & storage services
│   ├── middleware/             # Error handling
│   ├── data/                  # JSON file storage
│   └── server.js              # Entry point
│
├── .env.example               # Environment template
├── .gitignore
├── README.md
└── package.json               # Root scripts
```

---

## ⚡ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ installed
- [Ollama](https://ollama.com/) installed and running
- A model pulled (e.g., `ollama pull llama3.1:8b`)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/synapse-ai.git
cd synapse-ai

# 2. Install all dependencies
npm run install:all

# 3. Set up environment variables
cp .env.example server/.env

# 4. Make sure Ollama is running with a model
ollama serve
ollama pull llama3.1:8b

# 5. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | System status + Ollama connection |
| `GET` | `/api/chat/conversations` | List all conversations |
| `POST` | `/api/chat/conversations` | Create new conversation |
| `POST` | `/api/chat/conversations/:id/message` | Send message (SSE stream) |
| `POST` | `/api/summarize` | Summarize text |
| `POST` | `/api/code-review` | Review code |
| `POST` | `/api/sentiment` | Analyze sentiment |

---

## 🧠 AI Concepts Demonstrated

1. **Streaming Responses (SSE)** — Token-by-token response streaming, the same technique used by ChatGPT
2. **Prompt Engineering** — Carefully crafted system prompts for different AI behaviors
3. **Structured Output** — Getting JSON-formatted responses from an LLM (sentiment analysis)
4. **Conversation Context** — Maintaining chat history for contextual responses
5. **Local AI Inference** — Running models on consumer hardware via Ollama
6. **Tokenization** — Interactive demo of how text is converted to tokens

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using React + Express + Ollama**

</div>
