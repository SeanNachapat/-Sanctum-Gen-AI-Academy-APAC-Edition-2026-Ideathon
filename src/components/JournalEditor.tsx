import React, { useState } from 'react';
import { 
  Sparkles, 
  Save, 
  Send, 
  Compass, 
  Lightbulb, 
  Check, 
  AlertCircle, 
  Loader2, 
  Tag, 
  Smile, 
  SlidersHorizontal,
  RefreshCw,
  BookMarked,
  Layers,
  ArrowRight
} from 'lucide-react';
import type { ReflectionCategory, ReflectionTone, JournalEntry, ReflectionResponse } from '../types';

interface JournalEditorProps {
  userId: string;
  onSaveSuccess: (entry: JournalEntry) => void;
  onOpenConversation: (entry: JournalEntry) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORIES: { id: ReflectionCategory; label: string; icon: string; desc: string }[] = [
  { id: 'reflection', label: 'Reflection', icon: '🪞', desc: 'Personal introspection & growth' },
  { id: 'brainstorm', label: 'Brainstorm', icon: '💡', desc: 'Ideation, solutions & strategies' },
  { id: 'daily', label: 'Daily Log', icon: '📝', desc: 'Day summary, highlights & energy' },
  { id: 'gratitude', label: 'Gratitude', icon: '✨', desc: 'Appreciation & positive anchors' },
  { id: 'challenge', label: 'Challenge', icon: '🧗', desc: 'Navigating obstacles & stress' },
  { id: 'creative', label: 'Creative', icon: '🎨', desc: 'Free writing & imagination' },
];

const MOODS = [
  { id: 'thoughtful', label: 'Thoughtful', emoji: '💭' },
  { id: 'grateful', label: 'Grateful', emoji: '🙏' },
  { id: 'motivated', label: 'Motivated', emoji: '🚀' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🌊' },
  { id: 'energized', label: 'Energized', emoji: '⚡' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌪️' },
  { id: 'curious', label: 'Curious', emoji: '🔍' },
];

const TONES: { id: ReflectionTone; label: string; desc: string }[] = [
  { id: 'empathic', label: 'Empathetic Companion', desc: 'Warm, supportive, and emotionally attuned' },
  { id: 'analytical', label: 'Strategic Analyst', desc: 'Logical breakdown, root causes & cognitive patterns' },
  { id: 'philosophical', label: 'Mindful Philosopher', desc: 'Stoic perspectives, timeless wisdom & big picture' },
  { id: 'action_oriented', label: 'Action Motivator', desc: 'High-leverage next steps & concrete momentum' },
  { id: 'creative', label: 'Creative Muse', desc: 'Imaginative analogies, metaphors & lateral ideas' },
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  onSaveSuccess,
  onOpenConversation,
  showToast,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ReflectionCategory>('reflection');
  const [mood, setMood] = useState('thoughtful');
  const [tone, setTone] = useState<ReflectionTone>('empathic');
  const [tagsInput, setTagsInput] = useState('');

  // AI State
  const [generating, setGenerating] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [fetchingPrompts, setFetchingPrompts] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [showPromptDrawer, setShowPromptDrawer] = useState(false);

  // Latest generated reflection preview
  const [generatedResult, setGeneratedResult] = useState<{
    entry: JournalEntry;
    reflectionData: ReflectionResponse;
  } | null>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  // Fetch inspiration prompts from Gemini
  const handleFetchPrompts = async () => {
    try {
      setFetchingPrompts(true);
      setShowPromptDrawer(true);
      const res = await fetch('/api/gemini/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, mood, focus: title }),
      });
      if (!res.ok) throw new Error('Could not generate prompts');
      const data = await res.json();
      if (Array.isArray(data.prompts)) {
        setPrompts(data.prompts);
      }
    } catch (err: any) {
      console.error('Error fetching prompts:', err);
      showToast('Could not load AI prompts, showing default prompts.', 'info');
      setPrompts([
        'What is on your mind most strongly right now?',
        'What is an obstacle you overcame recently, and what did it teach you?',
        'What are three small moments that brought peace today?',
        'If you took one bold step towards your current goal, what would it look like?'
      ]);
    } finally {
      setFetchingPrompts(false);
    }
  };

  // Submit and reflect with Gemini API, then persist to Firestore
  const handleReflectAndSave = async () => {
    if (!content.trim()) {
      showToast('Please write something in your journal before reflecting.', 'error');
      return;
    }

    try {
      setGenerating(true);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      // 1. Request Gemini reflection from server-side proxy
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Untitled Reflection',
          content: content.trim(),
          category,
          mood,
          tone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error (${res.status})`);
      }

      const aiData: ReflectionResponse = await res.json();

      // 2. Persist to Firestore with guaranteed transaction verification
      const { saveJournalEntry } = await import('../lib/firestoreService');
      const savedEntry = await saveJournalEntry(userId, {
        title: title.trim() || `Reflection: ${new Date().toLocaleDateString()}`,
        content: content.trim(),
        category,
        mood,
        tags: parsedTags,
        toneUsed: tone,
        summary: aiData.summary,
        aiReflection: aiData.reflection,
        keyTakeaways: aiData.keyTakeaways || [],
        actionItems: aiData.actionItems || [],
      });

      setGeneratedResult({
        entry: savedEntry,
        reflectionData: aiData,
      });

      onSaveSuccess(savedEntry);
      showToast('Reflection analyzed by Gemini & securely saved to Firestore!', 'success');
    } catch (err: any) {
      console.error('Error generating reflection:', err);
      showToast(`Error: ${err?.message || 'Failed to generate reflection'}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Save entry only without invoking Gemini API
  const handleSaveOnly = async () => {
    if (!content.trim()) {
      showToast('Please write something in your journal before saving.', 'error');
      return;
    }

    try {
      setSavingManual(true);
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const { saveJournalEntry } = await import('../lib/firestoreService');
      const savedEntry = await saveJournalEntry(userId, {
        title: title.trim() || `Journal Entry: ${new Date().toLocaleDateString()}`,
        content: content.trim(),
        category,
        mood,
        tags: parsedTags,
        toneUsed: tone,
      });

      onSaveSuccess(savedEntry);
      showToast('Journal entry saved privately to Firestore!', 'success');
      
      // Reset form
      setTitle('');
      setContent('');
      setTagsInput('');
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(`Failed to save entry: ${err?.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingManual(false);
    }
  };

  const handleApplyPrompt = (promptText: string) => {
    if (!content.trim()) {
      setContent(`Prompt: ${promptText}\n\n`);
    } else {
      setContent((prev) => `${prev}\n\nReflection Question: ${promptText}\n`);
    }
    showToast('Prompt inserted into journal editor', 'info');
  };

  const handleStartNewAfterGeneration = () => {
    setGeneratedResult(null);
    setTitle('');
    setContent('');
    setTagsInput('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* If an entry was just generated and saved, display the Reflection Result banner */}
      {generatedResult ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="rounded-2xl border border-[#2C2C2E] bg-[#0D0D0F] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#5E5CE6]" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F23] pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5E5CE6] text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5E5CE6]">
                    Gemini Insights Generated
                  </span>
                  <h2 className="text-xl font-serif italic text-[#F2F2F7]">
                    {generatedResult.entry.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="converse-gemini-btn"
                  onClick={() => onOpenConversation(generatedResult.entry)}
                  className="flex items-center gap-2 rounded-xl bg-[#5E5CE6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#5E5CE6]/20 hover:bg-[#4745D1] transition-all cursor-pointer"
                >
                  <span>Converse with Gemini</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  id="write-another-btn"
                  onClick={handleStartNewAfterGeneration}
                  className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] px-4 py-2 text-xs font-medium text-[#D1D1D6] hover:bg-[#2C2C2E] hover:text-white transition-all cursor-pointer"
                >
                  Write Another
                </button>
              </div>
            </div>

            {/* Summary */}
            {generatedResult.reflectionData.summary && (
              <div className="mt-5 rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
                <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5E5CE6] mb-1">
                  Executive Essence
                </h4>
                <p className="text-xs text-[#D1D1D6] font-light leading-relaxed">
                  {generatedResult.reflectionData.summary}
                </p>
              </div>
            )}

            {/* Deep Reflection */}
            <div className="mt-5">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5E5CE6] mb-2 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                <span>Deep Reflection & Perspective</span>
              </h4>
              <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/50 p-5 text-[#D1D1D6] text-sm leading-relaxed font-serif">
                {generatedResult.reflectionData.reflection}
              </div>
            </div>

            {/* Key Takeaways & Action Items */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Takeaways */}
              {generatedResult.reflectionData.keyTakeaways?.length > 0 && (
                <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
                  <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#30D158] mb-3 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    <span>Key Takeaways</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-[#AEAEB2]">
                    {generatedResult.reflectionData.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#30D158] font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {generatedResult.reflectionData.actionItems?.length > 0 && (
                <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
                  <h5 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5E5CE6] mb-3 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>Suggested Next Steps</span>
                  </h5>
                  <ul className="space-y-2 text-xs text-[#AEAEB2]">
                    {generatedResult.reflectionData.actionItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#5E5CE6] font-bold">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Suggested Follow-Up Inquiries */}
            {generatedResult.reflectionData.suggestedFollowUps?.length > 0 && (
              <div className="mt-6 border-t border-[#1F1F23] pt-4">
                <h5 className="text-[10px] uppercase tracking-[0.2em] text-[#636366] font-semibold mb-2">
                  Explore Deeper in Multi-Turn Chat:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {generatedResult.reflectionData.suggestedFollowUps.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onOpenConversation(generatedResult.entry)}
                      className="rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] px-3 py-1.5 text-xs text-[#D1D1D6] hover:border-[#5E5CE6] hover:text-white transition-all text-left cursor-pointer"
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* Standard Journal Writing Form */
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#636366] font-semibold mb-1">
                Cognitive Studio
              </div>
              <h1 className="text-2xl font-bold text-[#F2F2F7] tracking-tight font-serif italic sm:text-3xl">
                Create Reflection & Journal Entry
              </h1>
              <p className="text-xs text-[#8E8E93] mt-1">
                Write freely. Gemini will generate insights, root-cause analyses, and action steps saved to your Firestore database.
              </p>
            </div>

            <button
              id="ai-prompts-btn"
              onClick={handleFetchPrompts}
              disabled={fetchingPrompts}
              className="flex items-center gap-1.5 rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] px-3.5 py-2 text-xs font-medium text-[#D1D1D6] hover:border-[#5E5CE6] hover:text-white transition-all cursor-pointer"
            >
              {fetchingPrompts ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5E5CE6]" />
              ) : (
                <Lightbulb className="h-3.5 w-3.5 text-[#5E5CE6]" />
              )}
              <span>AI Inspiration Prompts</span>
            </button>
          </div>

          {/* Prompt Drawer if opened */}
          {showPromptDrawer && (
            <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4 sm:p-5 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[#5E5CE6]" />
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5E5CE6]">
                    Inspiration Prompts for {category} ({mood})
                  </h3>
                </div>
                <button
                  onClick={() => setShowPromptDrawer(false)}
                  className="text-xs text-[#8E8E93] hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {prompts.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleApplyPrompt(p)}
                    className="cursor-pointer rounded-lg border border-[#2C2C2E] bg-[#0A0A0B] p-3 text-xs text-[#D1D1D6] hover:border-[#5E5CE6] hover:bg-[#1C1C1E] hover:text-white transition-all"
                  >
                    <p className="font-serif italic">"{p}"</p>
                    <span className="mt-2 inline-block text-[10px] uppercase tracking-wider text-[#5E5CE6] font-medium">
                      + Insert into journal
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Tabs */}
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366] mb-2">
              Reflection Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  onClick={() => setCategory(cat.id)}
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    category === cat.id
                      ? 'border-[#5E5CE6] bg-[#5E5CE6]/20 text-white shadow-sm'
                      : 'border-[#2C2C2E] bg-[#1C1C1E] text-[#8E8E93] hover:bg-[#2C2C2E] hover:text-[#D1D1D6]'
                  }`}
                >
                  <span className="text-xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mood & Tone Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Mood Picker */}
            <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366] mb-2.5 flex items-center gap-1.5">
                <Smile className="h-3.5 w-3.5 text-[#5E5CE6]" />
                <span>Current State / Mood</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    id={`mood-btn-${m.id}`}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      mood === m.id
                        ? 'bg-[#2C2C2E] text-white border border-[#3A3A3C] shadow-sm'
                        : 'bg-[#0A0A0B] text-[#8E8E93] border border-[#2C2C2E] hover:bg-[#2C2C2E]/60 hover:text-[#D1D1D6]'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Reflection Tone */}
            <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366] mb-2.5 flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#5E5CE6]" />
                <span>Gemini Reflection Persona</span>
              </label>
              <select
                id="tone-select"
                value={tone}
                onChange={(e) => setTone(e.target.value as ReflectionTone)}
                className="w-full rounded-lg border border-[#2C2C2E] bg-[#0A0A0B] px-3 py-2 text-xs font-medium text-[#D1D1D6] focus:border-[#5E5CE6] focus:outline-none cursor-pointer"
              >
                {TONES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#1C1C1E] text-[#D1D1D6]">
                    {t.label} - {t.desc}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Main Journal Inputs */}
          <div className="rounded-2xl border border-[#2C2C2E] bg-[#1C1C1E]/50 p-5 sm:p-6 space-y-4">
            
            {/* Title */}
            <div>
              <label htmlFor="journal-title" className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366] mb-1.5">
                Title / Focus Topic
              </label>
              <input
                id="journal-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Architecture of Habits, Stoic resilience notes, Next creative sprint..."
                className="w-full rounded-xl border border-[#2C2C2E] bg-[#0A0A0B] px-4 py-2.5 text-sm font-medium text-white placeholder-[#48484A] focus:border-[#5E5CE6] focus:outline-none"
              />
            </div>

            {/* Content Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="journal-content" className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366]">
                  Journal Thoughts & Observations
                </label>
                <div className="text-[10px] uppercase tracking-wider text-[#636366] font-mono">
                  {wordCount} words • {charCount} chars
                </div>
              </div>
              
              <textarea
                id="journal-content"
                rows={10}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write honestly about what happened, how you felt, the challenge you are untangling, or the idea you are shaping..."
                className="w-full rounded-xl border border-[#2C2C2E] bg-[#0A0A0B] p-4 text-sm leading-relaxed text-[#D1D1D6] placeholder-[#48484A] font-serif focus:border-[#5E5CE6] focus:outline-none resize-y"
              />
            </div>

            {/* Tags / Keywords */}
            <div>
              <label htmlFor="journal-tags" className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366] mb-1.5 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <span>Tags (comma separated)</span>
              </label>
              <input
                id="journal-tags"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. leadership, mindset, productivity, personal"
                className="w-full rounded-lg border border-[#2C2C2E] bg-[#0A0A0B] px-3 py-1.5 text-xs text-[#D1D1D6] placeholder-[#48484A] focus:border-[#5E5CE6] focus:outline-none"
              />
            </div>

          </div>

          {/* Action Submission Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1F1F23] pt-5">
            <div className="text-[10px] uppercase tracking-widest text-[#636366] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158]" />
              <span>Isolated in <code className="text-[#8E8E93]">/users/{userId}/entries</code></span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              
              {/* Save Only Button */}
              <button
                id="save-only-btn"
                type="button"
                onClick={handleSaveOnly}
                disabled={savingManual || generating}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] px-4 py-2.5 text-xs font-medium text-[#D1D1D6] hover:bg-[#2C2C2E] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Entry Only</span>
              </button>

              {/* Reflect with Gemini & Save */}
              <button
                id="reflect-save-btn"
                type="button"
                onClick={handleReflectAndSave}
                disabled={generating || savingManual}
                className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-[#5E5CE6] px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#5E5CE6]/20 hover:bg-[#4745D1] transition-all disabled:opacity-50 cursor-pointer"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Reflect with Gemini & Save</span>
                  </>
                )}
              </button>

            </div>
          </div>

        </div>
      )}

    </div>
  );
};
