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
    const { 
      title = '', 
      content = '', 
      category = 'reflection', 
      mood = 'thoughtful', 
      tone = 'empathic',
      stagedInput,
      emotions: reqEmotions
    } = body;

    const EMOTION_MAP: Record<string, { label: string; color: string; name: string }> = {
      peaceful: { label: 'Peaceful & Serene', color: '#5E5CE6', name: 'Twilight Indigo' },
      grateful: { label: 'Grateful & Warm', color: '#FF9F0A', name: 'Starlight Amber' },
      joyful: { label: 'Joyful & Content', color: '#30D158', name: 'Soft Mint' },
      tender: { label: 'Loved & Tender', color: '#FF375F', name: 'Rose Velvet' },
      thoughtful: { label: 'Thoughtful & Pensive', color: '#64D2FF', name: 'Moonlit Sky' },
      overwhelmed: { label: 'Overwhelmed & Full', color: '#BF5AF2', name: 'Deep Amethyst' },
      restless: { label: 'Restless & Unsettled', color: '#FF453A', name: 'Muted Ember' },
      exhausted: { label: 'Weary & Resting', color: '#8E8E93', name: 'Quiet Slate' },
    };

    // Helper to extract colors and gradient
    const buildGradient = (colors: string[]): string => {
      if (!colors || colors.length === 0) return 'linear-gradient(135deg, #5E5CE6 0%, #7B79FF 100%)';
      if (colors.length === 1) return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[0]}cc 100%)`;
      const stops = colors.map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`).join(', ');
      return `linear-gradient(135deg, ${stops})`;
    };

    // Selected feelings input from stagedInput or req
    const userSelectedEmotions: string[] = Array.isArray(stagedInput?.emotions) && stagedInput.emotions.length > 0
      ? stagedInput.emotions
      : Array.isArray(reqEmotions) && reqEmotions.length > 0
      ? reqEmotions
      : stagedInput?.emotion
      ? [stagedInput.emotion]
      : mood
      ? [mood]
      : ['Peaceful & Serene'];

    if ((!content || typeof content !== 'string' || content.trim().length === 0) && !stagedInput) {
      res.status(400).json({ error: 'Journal content or staged input is required for reflection' });
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

    const systemPrompt = `You are Sanctum, a tranquil, wise, and soothing bedtime reflection companion.
The user is winding down before going to bed. They have shared their thoughts, reflections, or staged answers about their day.
The user can select multiple feelings that describe tonight. Your task is to synthesize their day into a peaceful, uncluttered bedtime journal organized into distinct topics, weave together their selected feelings into a cohesive emotional gradient, and assign the harmonious emotion color gradient for their night calendar.

Emotion Palette to reference:
- "Peaceful & Serene" (Hex: "#5E5CE6", Name: "Twilight Indigo") -> calm, stillness, quiet satisfaction
- "Grateful & Warm" (Hex: "#FF9F0A", Name: "Starlight Amber") -> gratitude, appreciation, warmth
- "Joyful & Content" (Hex: "#30D158", Name: "Soft Mint") -> cheerfulness, vitality, success
- "Loved & Tender" (Hex: "#FF375F", Name: "Rose Velvet") -> love, intimacy, connection
- "Thoughtful & Pensive" (Hex: "#64D2FF", Name: "Moonlit Sky") -> deep reflection, curiosity
- "Overwhelmed & Full" (Hex: "#BF5AF2", Name: "Deep Amethyst") -> sensory overload, heavy thoughts
- "Restless & Unsettled" (Hex: "#FF453A", Name: "Muted Ember") -> tension, racing thoughts
- "Weary & Resting" (Hex: "#8E8E93", Name: "Quiet Slate") -> physical/mental exhaustion, deep sleep

Tone & Style:
${toneGuide}
Keep text minimal, elegant, comforting, and free of corporate or robotic filler words.
Structure the journal into 3-4 distinct topics, such as:
1. "Today's Rhythm" (The narrative of their day and milestones)
2. "Unpacking & Letting Go" (Releasing heavy thoughts, worries, or friction)
3. "Gratitude & Small Sparks" (Cherishing small sweet moments)
4. "Night Blessing & Rest" (A warm wish and peaceful perspective for the night)

Respond with a strictly valid JSON object containing:
- "title": A poetic, gentle title for tonight's journal (e.g., "The Quiet Echo of Evening", "Setting Down the Day's Noise").
- "emotions": An array of strings representing the feelings picked (e.g. ["Peaceful & Serene", "Grateful & Warm"]).
- "emotion": A concise string naming the blend of feelings (e.g. "Peaceful & Grateful").
- "emotionColors": An array of hex color codes corresponding to the emotions (e.g. ["#5E5CE6", "#FF9F0A"]).
- "emotionColor": The primary hex code (e.g. "#5E5CE6").
- "emotionGradient": A CSS linear-gradient string (e.g. "linear-gradient(135deg, #5E5CE6 0%, #FF9F0A 100%)").
- "emotionColorName": The blended color name (e.g. "Twilight Indigo & Starlight Amber").
- "bedtimeAffirmation": A 1-2 sentence soothing bedtime affirmation to help the user release tension and sleep peacefully.
- "topics": An array of 3-4 topic objects, each having:
  - "id": a slug (e.g., "rhythm", "release", "gratitude", "blessing")
  - "title": topic title
  - "icon": one of "moon", "wind", "sparkles", "heart", "stars", "compass"
  - "content": 2-4 sentences of comforting, well-crafted prose for this topic
- "summary": A 1-2 sentence essence of today.
- "reflection": A cohesive 2-3 paragraph synthesis combining the topics.
- "keyTakeaways": An array of 2-3 gentle, calming insights from today.
- "actionItems": An array of 1-2 gentle morning intentions (e.g., "Begin tomorrow without rushing to a screen").
- "suggestedFollowUps": An array of 2 gentle bedtime reflection questions if they wish to chat.`;

    let userPrompt = '';
    if (stagedInput) {
      userPrompt = `User's Staged Bedtime Reflection:
- Selected Feelings / Emotions: ${userSelectedEmotions.join(', ')}
- Energy Level: "${stagedInput.energyLevel || 'Calm'}"
- Today's Journey & Highlights: """${stagedInput.highlights || content || 'A quiet day with subtle moments.'}"""
- Daily Themes/Tags: ${(stagedInput.tags && stagedInput.tags.length > 0) ? stagedInput.tags.join(', ') : 'Daily Life'}
- Releasing & Letting Go: """${stagedInput.lettingGo || 'Mind is at peace, ready to rest.'}"""
- Gratitude & Sweet Moments: """${stagedInput.gratitude || 'Grateful for warmth, breath, and stillness.'}"""
- Date: "${stagedInput.date || new Date().toISOString().split('T')[0]}"`;
    } else {
      userPrompt = `Journal Title: "${title || 'Bedtime Reflection'}"
Category: ${category}
Selected Feelings / Moods: ${userSelectedEmotions.join(', ')}
Journal Entry:
"""
${content}
"""`;
    }

    const { text, modelUsed } = await generateContentWithFallback({
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        responseMimeType: 'application/json'
      }
    });

    try {
      const cleanJsonStr = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJsonStr);

      // Ensure emotionColors and emotionGradient exist and are valid
      const parsedColors: string[] = Array.isArray(parsed.emotionColors) && parsed.emotionColors.length > 0
        ? parsed.emotionColors.filter((c: any) => typeof c === 'string' && c.startsWith('#'))
        : userSelectedEmotions.map(e => {
            const lower = e.toLowerCase();
            for (const [k, v] of Object.entries(EMOTION_MAP)) {
              if (lower.includes(k) || lower.includes(v.label.toLowerCase())) return v.color;
            }
            return '#5E5CE6';
          });

      const finalColors = parsedColors.length > 0 ? parsedColors : ['#5E5CE6'];
      const finalGradient = parsed.emotionGradient && typeof parsed.emotionGradient === 'string' && parsed.emotionGradient.startsWith('linear-gradient')
        ? parsed.emotionGradient
        : buildGradient(finalColors);

      res.json({
        ...parsed,
        emotions: Array.isArray(parsed.emotions) && parsed.emotions.length > 0 ? parsed.emotions : userSelectedEmotions,
        emotionColors: finalColors,
        emotionGradient: finalGradient,
        emotionColor: parsed.emotionColor || finalColors[0],
        modelUsed
      });
    } catch (parseErr) {
      console.warn('Could not parse JSON response from Gemini, formatting fallback structure:', parseErr);
      const fallbackColors = userSelectedEmotions.map(e => {
        const lower = e.toLowerCase();
        for (const [k, v] of Object.entries(EMOTION_MAP)) {
          if (lower.includes(k) || lower.includes(v.label.toLowerCase())) return v.color;
        }
        return '#5E5CE6';
      });
      const finalColors = fallbackColors.length > 0 ? fallbackColors : ['#5E5CE6'];
      res.json({
        title: title || 'Evening Stillness',
        emotions: userSelectedEmotions,
        emotion: userSelectedEmotions.join(' & '),
        emotionColors: finalColors,
        emotionGradient: buildGradient(finalColors),
        emotionColor: finalColors[0],
        emotionColorName: userSelectedEmotions.length > 1 ? 'Blended Night Gradient' : 'Twilight Indigo',
        bedtimeAffirmation: 'You have carried enough for today. Let the night hold you in quiet warmth.',
        topics: [
          {
            id: 'rhythm',
            title: "Today's Rhythm",
            icon: 'moon',
            content: content || 'Today unfolded with moments of quiet purpose and steady presence.'
          },
          {
            id: 'release',
            title: 'Unpacking & Letting Go',
            icon: 'wind',
            content: 'Whatever remained unfinished today belongs to tomorrow. Tonight is solely for rest.'
          },
          {
            id: 'gratitude',
            title: 'Gratitude & Sweet Glow',
            icon: 'sparkles',
            content: 'Holding gratitude for the quiet sanctuary of the evening and the gift of closing your eyes.'
          }
        ],
        summary: 'A quiet evening reflection and mindful wind-down.',
        reflection: text,
        keyTakeaways: ['Honoring the day as complete', 'Allowing yourself full permission to rest'],
        actionItems: ['Take three deep slow breaths as your head touches the pillow'],
        suggestedFollowUps: ['How does your body feel right now as you prepare for sleep?'],
        modelUsed
      });
    }
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({ 
      error: error?.message || 'Failed to generate bedtime reflection with Gemini AI' 
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
