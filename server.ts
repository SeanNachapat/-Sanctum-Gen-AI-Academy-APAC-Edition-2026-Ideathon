import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Standard Top-Level Request Deserialization Ordering Guarantee
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy SDK Initialization
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment variables');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash'
];

interface FallbackOptions {
  contents: any;
  config?: any;
}

/**
 * Standard Helper: Resilient Gemini Model Fallback Executor
 * Attempts calls in order of speed and availability, recovering from transient errors.
 */
async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string }> {
  const ai = getGenAI();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      const text = response.text || '';
      return { text, modelUsed: model };
    } catch (err: any) {
      console.warn(`Attempt with model "${model}" failed:`, err?.message || err);
      lastError = err;
      // Recoverable codes include 503, 429, 404, 500, or model-not-found
      const status = err?.status || err?.code || 0;
      const isRecoverable = [404, 429, 500, 503].includes(status) || 
        String(err?.message || '').toLowerCase().includes('not found') ||
        String(err?.message || '').toLowerCase().includes('quota') ||
        String(err?.message || '').toLowerCase().includes('unavailable');

      if (!isRecoverable && model === MODEL_FALLBACK_LADDER[MODEL_FALLBACK_LADDER.length - 1]) {
        throw err;
      }
    }
  }

  throw lastError || new Error('All fallback models failed to generate content');
}

// API Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

/**
 * POST /api/gemini/reflect
 * Generates rich, empathic, structured reflections and takeaways from journal entries
 */
app.post('/api/gemini/reflect', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { title = '', content = '', category = 'reflection', mood = 'thoughtful', tone = 'empathic' } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Journal content is required for reflection' });
      return;
    }

    const toneInstructions: Record<string, string> = {
      empathic: 'Be deeply warm, supportive, validating, and emotionally attuned. Offer comfort, celebrate small wins, and provide gentle perspective.',
      analytical: 'Be clear, structured, and insightful. Break down root causes, identify cognitive patterns, and assess trade-offs logically.',
      philosophical: 'Reflect with wisdom, existential depth, stoic or mindfulness principles, and timeless perspective.',
      action_oriented: 'Focus on proactive momentum, practical habit-forming solutions, actionable clarity, and realistic next steps.',
      creative: 'Offer imaginative analogies, alternative viewpoints, creative synthesis, and thought-provoking metaphors.'
    };

    const toneGuide = toneInstructions[tone] || toneInstructions.empathic;

    const systemPrompt = `You are ReflectAI, an intelligent, compassionate, and wise journaling companion and thinking partner.
The user has shared an authentic journal entry.
Your goal is to provide a thoughtful, uplifting, and structured reflection.

Tone Guidance:
${toneGuide}

Respond with a well-structured JSON object containing the following keys:
- "summary": A concise 1-2 sentence essence of what the user wrote.
- "reflection": A thoughtful, deep, beautifully written paragraph (3-5 sentences) responding directly to the user's emotions, ideas, or experiences.
- "keyTakeaways": An array of 3-4 bullet points highlighting key insights, realizations, or themes identified in their entry.
- "actionItems": An array of 2-3 gentle, practical suggestions or micro-actions they could take next.
- "suggestedFollowUps": An array of 2-3 provocative, reflective questions they could explore in conversation or future entries.

Ensure the output is valid JSON strictly following this schema without Markdown codeblock wrapping if possible, or standard JSON inside triple backticks.`;

    const userPrompt = `Journal Title: "${title || 'Untitled'}"
Category: ${category}
Mood: ${mood}
Journal Entry:
"""
${content}
"""`;

    const { text, modelUsed } = await generateContentWithFallback({
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    try {
      // Clean possible markdown code fences if returned
      const cleanJsonStr = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      res.json({
        ...parsed,
        modelUsed
      });
    } catch (parseErr) {
      console.warn('Could not parse JSON response from Gemini, formatting raw fallback:', parseErr);
      res.json({
        summary: `Reflection on "${title || 'your entry'}"`,
        reflection: text,
        keyTakeaways: ['Deep self-awareness', 'Thoughtful reflection'],
        actionItems: ['Continue journaling regularly'],
        suggestedFollowUps: ['How did writing this make you feel?'],
        modelUsed
      });
    }
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({ 
      error: error?.message || 'Failed to generate reflection with Gemini AI' 
    });
  }
});

/**
 * POST /api/gemini/chat
 * Multi-turn conversational journal inquiry and brainstorming
 */
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { 
      entryTitle = '', 
      entryContent = '', 
      messages = [], 
      userMessage = '', 
      tone = 'empathic' 
    } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      res.status(400).json({ error: 'userMessage is required' });
      return;
    }

    const systemInstruction = `You are ReflectAI, an insightful, warm, and supportive AI journaling companion.
You are conversing with the user specifically about their journal reflection titled "${entryTitle || 'Reflection'}".

The user's original journal entry text is:
"""
${entryContent}
"""

Guidelines for this conversation:
- Keep your answers concise, engaging, and focused on helping the user explore their thoughts deeper.
- Validate their feelings, offer fresh perspectives, or gently ask thought-provoking questions.
- Use clean Markdown formatting when helpful (lists, bold words).
- Never be dismissive, robotic, or generic.`;

    // Construct conversation turns for Gemini
    const contents: any[] = [];

    // Add prior message history
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg && msg.text) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
    }

    // Add the current user query
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const { text, modelUsed } = await generateContentWithFallback({
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({
      reply: text,
      modelUsed
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ 
      error: error?.message || 'Failed to process chat message' 
    });
  }
});

/**
 * POST /api/gemini/prompts
 * Generates fresh creative writing inspiration and thought prompts
 */
app.post('/api/gemini/prompts', async (req: Request, res: Response) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const { category = 'reflection', mood = 'curious', focus = '' } = body;

    const promptRequest = `Generate 4 inspirational, deeply engaging, and thought-provoking journaling prompts for someone feeling ${mood}, focusing on ${category} ${focus ? `regarding ${focus}` : ''}.
Return a clean JSON array of strings containing the 4 prompt questions.`;

    const { text, modelUsed } = await generateContentWithFallback({
      contents: promptRequest,
      config: {
        responseMimeType: 'application/json'
      }
    });

    try {
      const cleanJsonStr = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const prompts = JSON.parse(cleanJsonStr);
      res.json({ prompts: Array.isArray(prompts) ? prompts : [prompts], modelUsed });
    } catch {
      res.json({
        prompts: [
          'What is one moment from today that changed your perspective?',
          'What are you holding onto that you might be ready to let go of?',
          'If you could give your present self one piece of gentle advice, what would it be?',
          'What are three small things that brought you unexpected joy recently?'
        ],
        modelUsed
      });
    }
  } catch (error: any) {
    console.error('Error in /api/gemini/prompts:', error);
    res.status(500).json({ error: 'Failed to generate prompts' });
  }
});

// Vite middleware & static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ReflectAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
