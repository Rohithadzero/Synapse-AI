// ============================================================
// SynapseAI — Code Review Controller
// AI-powered code analysis for bugs, performance & best practices
// ============================================================

import { generateResponse } from '../services/llmService.js';
import { addRecord, readAll } from '../services/storageService.js';

const CODE_REVIEW_PROMPT = `You are an expert senior software engineer performing a code review. Analyze the provided code and give a structured review with the following sections:

## 🐛 Bugs & Issues
List any bugs, logical errors, or potential runtime issues.

## ⚡ Performance
Identify any performance concerns or optimization opportunities.

## 🔒 Security
Flag any security vulnerabilities or unsafe practices.

## ✨ Best Practices
Suggest improvements for readability, maintainability, and coding standards.

## 📊 Overall Rating
Give an overall rating out of 10 and a one-line summary.

If a section has no issues, write "✅ No issues found" for that section.
Use markdown formatting. Be specific with line references when possible.`;

/**
 * POST /api/code-review — Review code
 * Body: { code: string, language: string }
 */
export async function reviewCode(req, res, next) {
  try {
    const { code, language = 'auto-detect' } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ success: false, error: 'Code is required' });
    }

    const prompt = `Language: ${language}\n\nCode to review:\n\`\`\`${language}\n${code}\n\`\`\``;

    // Uses req.llm options to route to correct provider
    const review = await generateResponse(prompt, CODE_REVIEW_PROMPT, req.llm);

    // Save to history
    const record = await addRecord('codeReviews', {
      codeSnippet: code.slice(0, 200) + (code.length > 200 ? '...' : ''),
      language,
      review,
      linesOfCode: code.split('\n').length,
    });

    res.json({
      success: true,
      data: {
        review,
        language,
        linesOfCode: code.split('\n').length,
        id: record.id,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/code-review/history — Get code review history
 */
export async function getReviewHistory(req, res, next) {
  try {
    const reviews = await readAll('codeReviews');
    const sorted = reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sorted });
  } catch (err) {
    next(err);
  }
}
