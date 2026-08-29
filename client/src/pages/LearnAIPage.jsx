// ============================================================
// SynapseAI — AI Learning Hub Page (v3 — Apple Design Language)
// Interactive educational content about how AI models work
// ============================================================

import { useState, useMemo } from 'react';
import {
  GraduationCap,
  BookOpen,
  Lightbulb,
  Layers,
  MessageSquare,
} from 'lucide-react';

// ── Simple Tokenizer Demo ──────────────────────────────────
function TokenizerDemo() {
  const [input, setInput] = useState('AI is transforming the world!');

  // Simple word-level tokenization for demonstration
  const tokens = useMemo(() => {
    if (!input.trim()) return [];
    // Split into subword-like tokens for demo purposes
    const words = input.split(/(\s+|[.,!?;:'"()\-])/g).filter(t => t.trim());
    return words.map((word, i) => ({
      id: i,
      text: word,
      // Simulate token IDs (deterministic but looks realistic)
      tokenId: Math.abs(word.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)) % 50000,
    }));
  }, [input]);

  return (
    <div className="tokenizer-demo">
      <h4 style={{ marginBottom: 'var(--space-12)', fontSize: 'var(--text-body)', fontWeight: 600 }}>
        Interactive Tokenizer
      </h4>
      <p style={{ fontSize: 'var(--text-caption)', color: 'rgba(255,255,255,0.56)', marginBottom: 'var(--space-16)', letterSpacing: '-0.224px' }}>
        Type any text below to see how an AI model breaks it into tokens. Each token gets a unique numeric ID
        that the model uses internally.
      </p>
      <input
        className="tokenizer-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type something to tokenize..."
      />
      <div className="tokenizer-output">
        {tokens.map((token) => (
          <span key={token.id} className="token" title={`Token ID: ${token.tokenId}`}>
            {token.text}
            <span style={{ opacity: 0.5, marginLeft: 6, fontSize: '0.7em' }}>
              {token.tokenId}
            </span>
          </span>
        ))}
      </div>
      {tokens.length > 0 && (
        <div className="token-stats">
          <span className="token-stat">
            <strong>{tokens.length}</strong> tokens
          </span>
          <span className="token-stat">
            <strong>{input.length}</strong> characters
          </span>
          <span className="token-stat">
            Ratio: <strong>{(input.length / tokens.length).toFixed(1)}</strong> chars/token
          </span>
        </div>
      )}
    </div>
  );
}

// ── Transformer Steps ──────────────────────────────────────
function TransformerExplainer() {
  const steps = [
    {
      title: 'Input Embedding',
      desc: 'Text is converted into numerical vectors (embeddings). Each token becomes a high-dimensional vector that captures semantic meaning. The word "king" and "queen" would have similar vectors.',
    },
    {
      title: 'Positional Encoding',
      desc: 'Since the model processes all tokens simultaneously (unlike RNNs), positional information is added to each embedding so the model knows the order of words in the sentence.',
    },
    {
      title: 'Self-Attention',
      desc: 'The core innovation! Each token "looks at" every other token to understand context. For example, in "The cat sat on the mat", the word "it" learns to attend to "cat". This is computed using Query, Key, and Value matrices.',
    },
    {
      title: 'Multi-Head Attention',
      desc: 'Multiple attention "heads" run in parallel, each learning different aspects of relationships — one might learn syntax, another semantics, another coreference. This is why models develop rich understanding.',
    },
    {
      title: 'Feed-Forward Network',
      desc: 'After attention, each token passes through a neural network. This is where the model "thinks" — transforming the contextual information into useful representations for the next layer.',
    },
    {
      title: 'Layer Stacking (Depth)',
      desc: 'These attention + feed-forward blocks are stacked many times (e.g., 32 layers in Llama 3.1 8B). Each layer builds more abstract understanding — early layers capture syntax, later layers capture meaning and reasoning.',
    },
    {
      title: 'Output Prediction',
      desc: 'The final layer produces probability scores for every possible next token. The model selects the most likely token, adds it to the sequence, and repeats — this is how text is generated word by word.',
    },
  ];

  return (
    <div className="transformer-steps">
      {steps.map((step, i) => (
        <div key={i} className="transformer-step">
          <div className="step-number">{i + 1}</div>
          <div className="step-content">
            <h4>{step.title}</h4>
            <p>{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Prompt Engineering Examples ─────────────────────────────
function PromptGuide() {
  const examples = [
    {
      bad: 'Summarize this.',
      good: 'Summarize the following article in 3 bullet points, focusing on the key arguments and conclusions. Keep the language simple and accessible.',
      topic: 'Summarization',
    },
    {
      bad: 'Fix my code.',
      good: 'Review this Python function for bugs, performance issues, and security vulnerabilities. Explain each issue found and provide a corrected version with comments.',
      topic: 'Code Review',
    },
    {
      bad: 'Write about dogs.',
      good: 'Write a 200-word informative paragraph about the top 3 health benefits of owning a dog, citing scientific studies. Use a warm, conversational tone.',
      topic: 'Content Writing',
    },
    {
      bad: 'Is this email good?',
      good: 'Analyze this professional email for tone, clarity, and effectiveness. Rate it 1-10 and suggest specific rewording for any unclear sentences. The audience is a potential client.',
      topic: 'Email Analysis',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
      {examples.map((ex, i) => (
        <div key={i}>
          <h4 style={{ fontSize: 'var(--text-caption)', fontWeight: 600, marginBottom: 'var(--space-12)', color: 'rgba(255,255,255,0.56)', letterSpacing: '-0.224px' }}>
            {ex.topic}
          </h4>
          <div className="prompt-examples">
            <div className="prompt-card bad">
              <div className="prompt-card-label">Vague Prompt</div>
              <p>"{ex.bad}"</p>
            </div>
            <div className="prompt-card good">
              <div className="prompt-card-label">Effective Prompt</div>
              <p>"{ex.good}"</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function LearnAIPage() {
  return (
    <div className="learn-ai">
      <div className="page-header">
        <h2>AI Learning Hub</h2>
        <p>
          Understand how Large Language Models work — from tokenization to
          transformer architecture to prompt engineering.
        </p>
      </div>

      {/* Section 1: What is an LLM? */}
      <div className="learn-section">
        <h3>
          <BookOpen size={20} /> What is a Large Language Model?
        </h3>
        <div className="learn-content">
          <p>
            A <strong>Large Language Model (LLM)</strong> is a type of artificial intelligence that has been
            trained on massive amounts of text data to understand and generate human-like language. Models like
            <strong> Llama 3.1</strong> (which powers this app) have billions of parameters — numerical values
            that the model learned during training.
          </p>
          <p>
            Think of it like this: if you read every book, article, and website ever written, you'd develop
            an incredibly deep understanding of language, facts, and reasoning. That's essentially what an LLM
            does, but mathematically. It learns <strong>statistical patterns</strong> in language — what words
            typically follow other words, how sentences are structured, and even how to reason about problems.
          </p>
          <p>
            <strong>Key Facts about Llama 3.1 8B (your local model):</strong>
          </p>
          <ul style={{ paddingLeft: 'var(--space-20)', marginBottom: 0 }}>
            <li>Created by <strong>Meta (Facebook)</strong></li>
            <li><strong>8 billion parameters</strong> — 8,000,000,000 learned numerical values</li>
            <li>Trained on <strong>trillions of tokens</strong> of text data</li>
            <li>Runs <strong>100% locally</strong> on your computer via Ollama</li>
            <li>Supports <strong>128K context window</strong> — can process very long texts</li>
          </ul>
        </div>
      </div>

      {/* Section 2: Tokenization */}
      <div className="learn-section">
        <h3>
          <Lightbulb size={20} /> Tokenization — How AI Reads Text
        </h3>
        <div className="learn-content">
          <p>
            AI models can't read text like humans do. They need to convert text into numbers first.
            This process is called <strong>tokenization</strong>. A tokenizer breaks text into small
            pieces called <strong>tokens</strong>, which can be words, parts of words, or even individual
            characters.
          </p>
          <p>
            For example, the word "unhappiness" might be split into ["un", "happiness"] — two tokens.
            Common short words like "the" or "is" are usually single tokens. Each token gets a unique
            numeric ID from the model's vocabulary (typically 30,000-100,000 unique tokens).
          </p>
          <p>
            <strong>Try it yourself:</strong> Type in the demo below to see tokenization in action!
          </p>
        </div>
        <div style={{ marginTop: 'var(--space-16)' }}>
          <TokenizerDemo />
        </div>
      </div>

      {/* Section 3: Transformer Architecture */}
      <div className="learn-section">
        <h3>
          <Layers size={20} /> How Transformer Models Work
        </h3>
        <div className="learn-content">
          <p>
            Modern LLMs are built on the <strong>Transformer architecture</strong>, introduced in the
            famous 2017 paper <em>"Attention Is All You Need"</em> by Google researchers. The key innovation
            is the <strong>self-attention mechanism</strong>, which allows each word to "look at" every
            other word in the input to understand context.
          </p>
          <p>
            Here's a step-by-step breakdown of how text flows through a transformer:
          </p>
        </div>
        <div style={{ marginTop: 'var(--space-16)' }}>
          <TransformerExplainer />
        </div>
      </div>

      {/* Section 4: Prompt Engineering */}
      <div className="learn-section">
        <h3>
          <MessageSquare size={20} /> Prompt Engineering — Talking to AI Effectively
        </h3>
        <div className="learn-content">
          <p>
            <strong>Prompt engineering</strong> is the art of crafting instructions that get the best
            results from an AI model. The quality of your prompt directly impacts the quality of the
            response. A vague prompt gives vague results; a specific, well-structured prompt gives
            precise, useful results.
          </p>
          <p>
            <strong>Key principles:</strong>
          </p>
          <ul style={{ paddingLeft: 'var(--space-20)' }}>
            <li><strong>Be specific</strong> — Tell the model exactly what you want</li>
            <li><strong>Provide context</strong> — Share relevant background information</li>
            <li><strong>Define the format</strong> — Specify how you want the output structured</li>
            <li><strong>Set constraints</strong> — Mention word limits, tone, audience, etc.</li>
            <li><strong>Give examples</strong> — Show the model what good output looks like</li>
          </ul>
          <p>
            Compare these real examples:
          </p>
        </div>
        <div style={{ marginTop: 'var(--space-16)' }}>
          <PromptGuide />
        </div>
      </div>

      {/* Section 5: How SynapseAI Uses AI */}
      <div className="learn-section">
        <h3>
          <Lightbulb size={20} /> How SynapseAI Implements AI
        </h3>
        <div className="learn-content">
          <p>
            SynapseAI demonstrates real-world AI integration patterns used by companies like Google, Meta,
            and OpenAI. Here's how each feature works under the hood:
          </p>
          <ul style={{ paddingLeft: 'var(--space-20)' }}>
            <li>
              <strong>AI Chat:</strong> Uses the <code>/api/chat</code> endpoint with
              <strong> conversation history</strong> for context. Responses stream token-by-token using
              <strong> Server-Sent Events (SSE)</strong> — the same technique ChatGPT uses.
            </li>
            <li>
              <strong>Summarizer:</strong> Uses carefully crafted <strong>system prompts</strong> that
              instruct the model to summarize in different formats. This is prompt engineering in action.
            </li>
            <li>
              <strong>Code Review:</strong> The system prompt acts as a <strong>"senior engineer persona"
              </strong>, instructing the model to analyze code across multiple dimensions (bugs, security,
              performance).
            </li>
            <li>
              <strong>Sentiment Analysis:</strong> The model is instructed to output
              <strong> structured JSON</strong> with specific emotion scores. This demonstrates how to get
              machine-readable output from an LLM.
            </li>
          </ul>
          <p>
            <strong>Architecture pattern:</strong> React frontend → Express.js API → Ollama (local LLM).
            This is the same architecture pattern (client → server → AI service) used in production AI
            applications at scale.
          </p>
        </div>
      </div>
    </div>
  );
}
