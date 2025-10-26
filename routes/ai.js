const express = require('express');
const axios = require('axios');

const router = express.Router();

// Configuration (can be overridden via environment variables)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
// Default to a Gemini 2.5 Pro model + generateContent (these are available for this API key).
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
const GEMINI_METHOD = process.env.GEMINI_METHOD || 'generateContent';

// Helper: try to extract text from the provider response in a few common shapes
function extractTextFromResponse(data) {
  if (!data) return null;
  // common shapes: data.candidates[0].content.parts[0].text
  const cand = data?.candidates?.[0];
  // generateText variants may put text in candidate.output
  const textFromOutput = cand?.output;
  if (typeof textFromOutput === 'string' && textFromOutput.length) return textFromOutput;
  if (Array.isArray(textFromOutput) && typeof textFromOutput[0] === 'string') return textFromOutput[0];
  // some responses: cand.output[0].content or cand.output[0].text
  if (Array.isArray(textFromOutput) && textFromOutput[0]?.content) return textFromOutput[0].content;
  if (Array.isArray(textFromOutput) && textFromOutput[0]?.text) return textFromOutput[0].text;
  const textFromCandidates = cand?.content?.parts?.[0]?.text;
  if (textFromCandidates) return textFromCandidates;

  // some variants may return directly in output or text
  if (typeof data?.output === 'string') return data.output;
  if (typeof data?.text === 'string') return data.text;

  // try to find first string anywhere (safe fallback)
  try {
    const str = JSON.stringify(data);
    return str && str.length ? str : null;
  } catch (e) {
    return null;
  }
}

// Make a request to the configured Gemini-style endpoint. Returns extracted text.
async function geminiRequest(prompt, opts = {}) {
  if (!GEMINI_API_KEY) {
    const msg = 'GEMINI_API_KEY not set in environment. Set GEMINI_API_KEY in your .env or environment variables.';
    // Do not throw a raw error that will crash — caller will handle and return 503.
    const err = new Error(msg);
    err.isMissingKey = true;
    throw err;
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:${GEMINI_METHOD}`;

  const payload = {
    // shape payload according to method
    ...(GEMINI_METHOD === 'generateText'
      ? { prompt: { text: prompt } }
      : { contents: [{ parts: [{ text: prompt }] }] }),
    // allow callers to pass model-specific options via opts
    ...opts
  };

  try {
    const response = await axios.post(`${url}?key=${GEMINI_API_KEY}`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    const extracted = extractTextFromResponse(response.data);
    return extracted ?? 'No content returned from model.';
  } catch (err) {
    // Attach response details for better debugging
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      console.error('Gemini API response error:', status, JSON.stringify(data));
      const e = new Error(`Gemini API error (${status})`);
      e.providerStatus = status;
      e.providerData = data;
      throw e;
    }
    console.error('Gemini request failed:', err.message || err.toString());
    throw err;
  }
}

// If no API key, returning helpful 503 responses instead of internal server errors.
function requireApiKeyOrRespond(req, res) {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'AI service unavailable',
      message: 'GEMINI_API_KEY is not configured on the server. See README or set GEMINI_API_KEY in .env.'
    });
  }
  return null;
}

// Summarize endpoint
router.post('/summarize', async (req, res) => {
  // quick check
  const missing = requireApiKeyOrRespond(req, res);
  if (missing) return;

  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Please provide text to summarize' });

    const prompt = `Summarize the following text clearly and concisely:\n\n${text}`;
    const summary = await geminiRequest(prompt);
    res.json({ summary });
  } catch (err) {
    console.error('Summarize error:', err.message || err.toString());
    const payload = { error: 'AI service error' };
    if (err.providerData) payload.provider = { status: err.providerStatus, data: err.providerData };
    res.status(500).json(payload);
  }
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  const missing = requireApiKeyOrRespond(req, res);
  if (missing) return;

  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ msg: 'Please provide a query' });

    const answer = await geminiRequest(query);
    res.json({ answer });
  } catch (err) {
    console.error('Chat error:', err.message || err.toString());
    const payload = { error: 'AI service error' };
    if (err.providerData) payload.provider = { status: err.providerStatus, data: err.providerData };
    res.status(500).json(payload);
  }
});

// Quiz endpoint
router.post('/quiz', async (req, res) => {
  const missing = requireApiKeyOrRespond(req, res);
  if (missing) return;

  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ msg: 'Please provide a topic' });

    const prompt = `Generate 5 multiple choice questions about "${topic}". For each question, provide 4 options (A, B, C, D) and indicate the correct answer. Format the response as JSON.`;
    const quiz = await geminiRequest(prompt, { maxOutputTokens: 800 });
    res.json({ quiz });
  } catch (err) {
    console.error('Quiz error:', err.message || err.toString());
    const payload = { error: 'AI service error' };
    if (err.providerData) payload.provider = { status: err.providerStatus, data: err.providerData };
    res.status(500).json(payload);
  }
});

// Planner endpoint
router.post('/planner', async (req, res) => {
  const missing = requireApiKeyOrRespond(req, res);
  if (missing) return;

  try {
    const { subjects, daysAvailable } = req.body;
    if (!Array.isArray(subjects) || subjects.length === 0 || !daysAvailable) {
      return res.status(400).json({ msg: 'Please provide subjects (array) and daysAvailable' });
    }

    const prompt = `Create a study plan for these subjects: ${subjects.join(', ')}. I have ${daysAvailable} days available. Provide a day-by-day breakdown with recommended study hours for each subject.`;
    const plan = await geminiRequest(prompt);
    res.json({ plan });
  } catch (err) {
    console.error('Planner error:', err.message || err.toString());
    const payload = { error: 'AI service error' };
    if (err.providerData) payload.provider = { status: err.providerStatus, data: err.providerData };
    res.status(500).json(payload);
  }
});

module.exports = router;
