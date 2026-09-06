import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Heart, 
  Wind, 
  Feather, 
  Mic, 
  MicOff, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Compass, 
  Calendar as CalendarIcon, 
  BookOpen, 
  RefreshCw,
  Clock,
  Volume2
} from 'lucide-react';
import type { JournalEntry, StagedReflectionInput, JournalTopic } from '../types';
import { 
  EMOTION_PALETTE, 
  getEmotionConfig, 
  getEntryColor, 
  getEntryGradient, 
  generateGradientFromKeys 
} from '../lib/emotionColors';
import { saveJournalEntry } from '../lib/firestoreService';

interface BedtimeStagedReflectionProps {
  userId: string;
  onSaveSuccess: (entry: JournalEntry) => void;
  onNavigateToCalendar: (date?: string) => void;
  onOpenReader: (entry: JournalEntry) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DAILY_THEMES = [
  'Work & Focus',
  'Loved Ones',
  'Quiet Rest',
  'Health & Body',
  'Small Wins',
  'Creative Spark',
  'Detours',
  'Nature'
];

const ENERGY_LEVELS = [
  { id: 'weary', label: 'Drained / Sleepy', icon: '🔋', desc: 'Ready for deep surrender' },
  { id: 'calm', label: 'Restful & Calm', icon: '🌙', desc: 'At peace and slowing down' },
  { id: 'centered', label: 'Balanced & Steady', icon: '🕯️', desc: 'Centered in the present' },
  { id: 'restless', label: 'Active Mind', icon: '⚡', desc: 'Thoughts still lingering' },
];

const WHISPER_PROMPTS = [
  'A conversation that stayed with me...',
  'A moment I felt truly present...',
  'A small victory nobody else saw...',
  'Something that surprised me today...'
];

const GRATITUDE_SUGGESTIONS = [
  'The warmth of my bed & quiet room',
  'A comforting meal today',
  'A kind word or message',
  'Having made it through the day',
  'The stillness of this night'
];

export const BedtimeStagedReflection: React.FC<BedtimeStagedReflectionProps> = ({
  userId,
  onSaveSuccess,
  onNavigateToCalendar,
  onOpenReader,
  showToast,
}) => {
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Form state
  const [selectedEmotionKeys, setSelectedEmotionKeys] = useState<string[]>(['peaceful']);
  const [selectedEnergy, setSelectedEnergy] = useState<string>('calm');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [highlightsText, setHighlightsText] = useState('');
  const [lettingGoText, setLettingGoText] = useState('');
  const [gratitudeText, setGratitudeText] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Generated Entry state
  const [generatedEntry, setGeneratedEntry] = useState<JournalEntry | null>(null);

  // Toggle emotion multi-selection
  const toggleEmotionKey = (key: string) => {
    setSelectedEmotionKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) {
          showToast('Keep at least one feeling to shade your night', 'info');
          return prev;
        }
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
  };

  const nightGradientMeta = generateGradientFromKeys(selectedEmotionKeys);

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        
        if (currentStage === 2) {
          setHighlightsText((prev) => prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim());
        } else if (currentStage === 3) {
          setLettingGoText((prev) => prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim());
        } else if (currentStage === 4) {
          setGratitudeText((prev) => prev ? `${prev} ${currentTranscript.trim()}` : currentTranscript.trim());
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [currentStage]);

  const toggleVoiceDictation = () => {
    if (!speechSupported || !recognitionRef.current) {
      showToast('Voice dictation is not supported in this browser', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast('Microphone paused', 'info');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Listening... Speak gently about your day', 'info');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
      }
    }
  };

  const toggleTheme = (theme: string) => {
    setSelectedThemes((prev) => 
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const handleNextStage = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (currentStage < 4) {
      setCurrentStage((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      handleGenerateReflection();
    }
  };

  const handlePrevStage = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (currentStage > 1) {
      setCurrentStage((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleClearMindSkip = () => {
    setLettingGoText('My mind is calm and peaceful tonight. I have set down today’s work.');
    handleNextStage();
  };

  const handleGenerateReflection = async () => {
    setIsGenerating(true);
    const chosenEmotions = selectedEmotionKeys.map((k) => EMOTION_PALETTE[k] || EMOTION_PALETTE.peaceful);
    const primaryEmotion = chosenEmotions[0];

    const stagedInput: StagedReflectionInput = {
      emotion: chosenEmotions.map(e => e.label).join(', '),
      emotions: chosenEmotions.map(e => e.label),
      energyLevel: selectedEnergy,
      highlights: highlightsText.trim() || 'A day of quiet pacing, small thoughts, and steady breath.',
      tags: selectedThemes,
      lettingGo: lettingGoText.trim() || 'No heavy burdens tonight; releasing the day willingly.',
      gratitude: gratitudeText.trim() || 'Grateful for the quiet evening, comfortable bed, and rest.',
      date: selectedDate
    };

    try {
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stagedInput,
          category: 'daily',
          mood: primaryEmotion.label,
          emotions: chosenEmotions.map(e => e.label),
          tone: 'empathic'
        })
      });

      if (!response.ok) {
        throw new Error(`Reflection request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Assemble complete entry with gradient metadata
      const emotionHex = data.emotionColor || primaryEmotion.color;
      const emotionName = data.emotionColorName || nightGradientMeta.name;
      const finalGradient = data.emotionGradient || nightGradientMeta.gradient;
      const finalColors = (Array.isArray(data.emotionColors) && data.emotionColors.length > 0)
        ? data.emotionColors
        : chosenEmotions.map(e => e.color);
      const finalEmotions = (Array.isArray(data.emotions) && data.emotions.length > 0)
        ? data.emotions
        : chosenEmotions.map(e => e.label);

      const topics: JournalTopic[] = Array.isArray(data.topics) && data.topics.length > 0 
        ? data.topics 
        : [
            { id: 'rhythm', title: "Today's Rhythm", icon: 'moon', content: data.summary || stagedInput.highlights },
            { id: 'release', title: "Unpacking & Letting Go", icon: 'wind', content: data.reflection || stagedInput.lettingGo },
            { id: 'gratitude', title: "Gratitude & Sweet Glow", icon: 'sparkles', content: stagedInput.gratitude }
          ];

      const newEntryPayload: Partial<JournalEntry> & { title: string; content: string } = {
        userId,
        title: data.title || `Bedtime Reflection • ${selectedDate}`,
        content: topics.map((t) => `### ${t.title}\n${t.content}`).join('\n\n'),
        category: 'daily',
        mood: primaryEmotion.label,
        emotion: data.emotion || finalEmotions.join(' & '),
        emotions: finalEmotions,
        emotionColor: emotionHex,
        emotionColors: finalColors,
        emotionGradient: finalGradient,
        emotionColorName: emotionName,
        date: selectedDate,
        topics,
        bedtimeAffirmation: data.bedtimeAffirmation || 'You have carried enough today. Let the night wrap you in quiet peace.',
        summary: data.summary || '',
        keyTakeaways: data.keyTakeaways || [],
        aiReflection: data.reflection || '',
        actionItems: data.actionItems || [],
        tags: selectedThemes,
        stagedInput
      };

      const saved = await saveJournalEntry(userId, newEntryPayload);
      setGeneratedEntry(saved);
      onSaveSuccess(saved);
      setCurrentStage(5);
      showToast('Tonight’s journal woven and saved to your calendar ✨', 'success');
    } catch (err: any) {
      console.error('Bedtime reflection generation error:', err);
      showToast(err?.message || 'Could not generate reflection', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetForNewNight = () => {
    setCurrentStage(1);
    setGeneratedEntry(null);
    setSelectedEmotionKeys(['peaceful']);
    setHighlightsText('');
    setLettingGoText('');
    setGratitudeText('');
    setSelectedThemes([]);
  };

  const currentEmotionConfig = EMOTION_PALETTE[selectedEmotionKeys[0]] || EMOTION_PALETTE.peaceful;

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-4 sm:py-8">
      {/* Mobile Header: Calm Night Ambiance */}
      <div className="flex items-center justify-between mb-5 border-b border-[#1F1F24] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#1A1A24] border border-[#2E2E3E] flex items-center justify-center text-[#5E5CE6]">
            <Moon className="h-4 w-4 fill-[#5E5CE6]/20" />
          </div>
          <div>
            <h2 className="text-sm font-serif font-medium text-white tracking-wide">Bedtime Wind-Down</h2>
            <p className="text-[11px] text-[#8E8E93]">Mindful evening reflection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#16161A] text-xs text-[#AEAEB2] border border-[#26262E] rounded-lg px-2 py-1 font-mono focus:outline-none focus:border-[#5E5CE6]"
          />
        </div>
      </div>

      {/* Progress Dots / Steps Indicator (when in stages 1-4) */}
      {currentStage <= 4 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-[11px] text-[#8E8E93] mb-2 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#5E5CE6]" />
              Stage {currentStage} of 4
            </span>
            <span className="text-[#AEAEB2]">
              {currentStage === 1 && 'Tonight’s Feeling'}
              {currentStage === 2 && 'Today’s Story'}
              {currentStage === 3 && 'Unburdening'}
              {currentStage === 4 && 'Gratitude'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === currentStage 
                    ? 'bg-[#5E5CE6] shadow-[0_0_8px_rgba(94,92,230,0.5)]' 
                    : step < currentStage 
                    ? 'bg-[#5E5CE6]/50' 
                    : 'bg-[#1C1C22]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* STAGE 1: Tonight's Feeling & Energy */}
      {currentStage === 1 && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-serif text-white font-medium">How does tonight feel?</h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">Select one or more feelings to weave your personal bedtime color gradient.</p>
          </div>

          {/* Emotion Grid (Multi-Select) */}
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(EMOTION_PALETTE).map(([key, item]) => {
              const isSelected = selectedEmotionKeys.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleEmotionKey(key)}
                  className={`relative flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
                    isSelected 
                      ? `${item.bgClass} ${item.borderClass} shadow-lg shadow-black/40 ring-1 ring-white/20 scale-[1.01]`
                      : 'bg-[#121216] border-[#1F1F24] hover:border-[#2C2C34]'
                  }`}
                >
                  <div className="relative mt-0.5 flex-shrink-0">
                    <span 
                      className="block h-3.5 w-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white text-black text-[7px] font-bold">
                        ✓
                      </span>
                    )}
                  </div>
                  <div>
                    <div className={`text-xs font-medium ${isSelected ? item.textClass : 'text-[#E5E5EA]'}`}>
                      {item.label}
                    </div>
                    <p className="text-[10px] text-[#8E8E93] line-clamp-1 mt-0.5 font-light">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Live Emotional Gradient Preview */}
          <div className="p-3.5 rounded-2xl bg-[#121216] border border-[#22222C] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#AEAEB2] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#FF9F0A]" />
                Tonight’s Emotional Gradient
              </span>
              <span className="text-[10px] font-mono text-[#8E8E93]">
                {selectedEmotionKeys.length} {selectedEmotionKeys.length === 1 ? 'feeling' : 'feelings blended'}
              </span>
            </div>

            {/* Visual Gradient Bar / Capsule */}
            <div 
              className="h-8 w-full rounded-xl transition-all duration-300 shadow-md flex items-center justify-center relative overflow-hidden px-3"
              style={{ background: nightGradientMeta.gradient }}
            >
              <div className="absolute inset-0 bg-black/15" />
              <span className="relative text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
                {nightGradientMeta.name}
              </span>
            </div>

            {/* Active Feeling Tags */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {selectedEmotionKeys.map((key) => {
                const item = EMOTION_PALETTE[key];
                if (!item) return null;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleEmotionKey(key)}
                    className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border bg-[#16161E] border-[#2A2A36] text-white hover:border-red-500/40 hover:bg-red-500/10 transition-all group"
                    title="Click to remove feeling"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                    {selectedEmotionKeys.length > 1 && (
                      <span className="text-[10px] text-[#8E8E93] group-hover:text-red-400 ml-0.5">×</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Gauge */}
          <div className="pt-1">
            <label className="block text-xs font-medium text-[#AEAEB2] mb-2.5">
              Energy Level Tonight
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ENERGY_LEVELS.map((lvl) => {
                const isSelected = selectedEnergy === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedEnergy(lvl.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected 
                        ? 'bg-[#5E5CE6]/15 border-[#5E5CE6]/40 text-white' 
                        : 'bg-[#121216] border-[#1F1F24] text-[#8E8E93] hover:text-[#D1D1D6]'
                    }`}
                  >
                    <div className="text-base mb-1">{lvl.icon}</div>
                    <div className="text-xs font-medium">{lvl.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: What happened today? (The Story) */}
      {currentStage === 2 && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-lg font-serif text-white font-medium">Unpack today’s moments</h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">Speak or write freely. Keep it as simple or detailed as you like.</p>
          </div>

          {/* Quick Category Chips */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DAILY_THEMES.map((theme) => {
                const isSelected = selectedThemes.includes(theme);
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => toggleTheme(theme)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      isSelected
                        ? 'bg-[#5E5CE6]/20 border-[#5E5CE6]/50 text-white'
                        : 'bg-[#141418] border-[#222228] text-[#8E8E93] hover:text-[#D1D1D6]'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {theme}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clean Bedtime Textarea */}
          <div className="relative">
            <textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              placeholder="What stood out today? A conversation, a step forward, or simply how the hours passed..."
              rows={5}
              className="w-full bg-[#121216] border border-[#22222A] rounded-2xl p-4 text-xs sm:text-sm text-[#E5E5EA] placeholder-[#555560] focus:outline-none focus:border-[#5E5CE6] leading-relaxed resize-none transition-colors"
            />

            {/* Voice Dictation Button inside textarea */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              {isListening && (
                <span className="flex items-center gap-1.5 text-[10px] text-[#30D158] font-mono bg-[#30D158]/10 px-2 py-0.5 rounded-full border border-[#30D158]/30 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                  Listening...
                </span>
              )}

              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  title={isListening ? 'Stop voice recording' : 'Dictate with voice in bed'}
                  className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${
                    isListening
                      ? 'bg-[#FF453A] border-[#FF453A] text-white animate-pulse'
                      : 'bg-[#1C1C22] border-[#2E2E38] text-[#AEAEB2] hover:text-white hover:border-[#5E5CE6]'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>

          {/* Whisper prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] text-[#636366] uppercase tracking-wider font-mono">Whisper Prompts</span>
            <div className="flex flex-wrap gap-1.5">
              {WHISPER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setHighlightsText((prev) => prev ? `${prev} ${prompt}` : prompt);
                  }}
                  className="text-[11px] text-[#8E8E93] bg-[#14141A] border border-[#202028] px-2.5 py-1 rounded-lg hover:text-[#D1D1D6] hover:border-[#3A3A48] transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 3: Releasing & Letting Go */}
      {currentStage === 3 && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-lg font-serif text-white font-medium">Release before sleep</h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">What felt heavy today, or what thoughts are keeping your mind awake?</p>
          </div>

          {/* One-tap Clear Mind Button */}
          <button
            type="button"
            onClick={handleClearMindSkip}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#30D158]/30 bg-[#30D158]/5 hover:bg-[#30D158]/10 text-left transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🕊️</span>
              <div>
                <span className="text-xs font-medium text-[#30D158] block">My mind is clear tonight</span>
                <span className="text-[10px] text-[#8E8E93]">Skip this stage and keep your peace intact</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#30D158] transition-transform group-hover:translate-x-1" />
          </button>

          <div className="relative">
            <textarea
              value={lettingGoText}
              onChange={(e) => setLettingGoText(e.target.value)}
              placeholder="Unload any friction, unfinished tasks, or anxiety. Write them down so your mind doesn't have to carry them into sleep..."
              rows={5}
              className="w-full bg-[#121216] border border-[#22222A] rounded-2xl p-4 text-xs sm:text-sm text-[#E5E5EA] placeholder-[#555560] focus:outline-none focus:border-[#5E5CE6] leading-relaxed resize-none"
            />

            {speechSupported && (
              <div className="absolute bottom-3 right-3">
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${
                    isListening
                      ? 'bg-[#FF453A] border-[#FF453A] text-white animate-pulse'
                      : 'bg-[#1C1C22] border-[#2E2E38] text-[#AEAEB2] hover:text-white'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STAGE 4: Gratitude & Warm Closing */}
      {currentStage === 4 && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h3 className="text-lg font-serif text-white font-medium">A small spark of gratitude</h3>
            <p className="text-xs text-[#8E8E93] mt-0.5">One gentle thing, person, or sensation you appreciate tonight.</p>
          </div>

          {/* Gratitude Suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {GRATITUDE_SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setGratitudeText(sug)}
                className="text-[11px] text-[#AEAEB2] bg-[#14141A] border border-[#22222A] px-2.5 py-1 rounded-lg hover:text-white hover:border-[#FF9F0A]/40 transition-all"
              >
                ✨ {sug}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={gratitudeText}
              onChange={(e) => setGratitudeText(e.target.value)}
              placeholder="A warm shower, an honest laugh, quiet silence, or someone who listened..."
              rows={4}
              className="w-full bg-[#121216] border border-[#22222A] rounded-2xl p-4 text-xs sm:text-sm text-[#E5E5EA] placeholder-[#555560] focus:outline-none focus:border-[#FF9F0A] leading-relaxed resize-none"
            />

            {speechSupported && (
              <div className="absolute bottom-3 right-3">
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all ${
                    isListening
                      ? 'bg-[#FF453A] border-[#FF453A] text-white animate-pulse'
                      : 'bg-[#1C1C22] border-[#2E2E38] text-[#AEAEB2] hover:text-white'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Summary of tonight's choice */}
          <div className="rounded-xl bg-[#14141A] border border-[#22222C] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div 
                className="h-3.5 w-8 rounded-full shadow-sm"
                style={{ background: nightGradientMeta.gradient }}
              />
              <span className="text-xs text-[#D1D1D6]">
                Tonight’s Gradient: <strong className="text-white font-medium">{nightGradientMeta.name}</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8E8E93]">
              {selectedEmotionKeys.length} {selectedEmotionKeys.length === 1 ? 'feeling' : 'feelings'}
            </span>
          </div>
        </div>
      )}

      {/* STAGE CONTROLS / ACTION BAR (stages 1-4) */}
      {currentStage <= 4 && (
        <div className="mt-8 pt-4 border-t border-[#1C1C22] flex items-center justify-between gap-3">
          {currentStage > 1 ? (
            <button
              type="button"
              onClick={handlePrevStage}
              className="px-4 py-2.5 rounded-xl border border-[#282832] bg-[#141418] text-xs font-medium text-[#AEAEB2] hover:text-white hover:border-[#3E3E4C] transition-all flex items-center gap-1.5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNextStage}
            disabled={isGenerating}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5E5CE6] to-[#7B79FF] text-white text-xs font-medium shadow-lg shadow-[#5E5CE6]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ml-auto"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Weaving Bedtime Reflection...
              </>
            ) : currentStage === 4 ? (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Weave Bedtime Journal 🌙
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* GENERATING OVERLAY */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="relative mb-6">
            <div className="h-20 w-20 rounded-full bg-[#5E5CE6]/20 border border-[#5E5CE6]/40 flex items-center justify-center animate-pulse">
              <Moon className="h-9 w-9 text-[#5E5CE6]" />
            </div>
            <div className="absolute inset-0 rounded-full bg-[#5E5CE6]/10 animate-ping" />
          </div>
          <h3 className="text-base font-serif font-medium text-white mb-1">
            Weaving Tonight's Journal...
          </h3>
          <p className="text-xs text-[#8E8E93] max-w-xs leading-relaxed font-light">
            Distilling your day into peaceful topics and painting your emotional color into the night sky.
          </p>
        </div>
      )}

      {/* STAGE 5: The Generated Bedtime Journal Result */}
      {currentStage === 5 && generatedEntry && (
        <div className="space-y-6 animate-fadeIn">
          {/* Success Banner */}
          <div className="flex items-center justify-between bg-[#16161E] border border-[#262634] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
                style={{ background: getEntryGradient(generatedEntry) }}
              >
                <Moon className="h-5 w-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#8E8E93]">
                  {generatedEntry.date || selectedDate}
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white font-serif">
                    {generatedEntry.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span 
                className="inline-block text-[11px] font-medium px-3 py-1 rounded-full border shadow-sm text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                style={{ 
                  background: getEntryGradient(generatedEntry),
                  borderColor: 'rgba(255, 255, 255, 0.25)'
                }}
              >
                {generatedEntry.emotion || generatedEntry.emotionColorName || nightGradientMeta.name}
              </span>
            </div>
          </div>

          {/* Bedtime Affirmation Card */}
          {generatedEntry.bedtimeAffirmation && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#181824] to-[#12121A] border border-[#2E2E42] text-center space-y-1 relative overflow-hidden shadow-lg">
              <div className="text-xs text-[#AEAEB2] uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
                <Moon className="h-3 w-3 text-[#5E5CE6]" />
                Night Blessing
              </div>
              <p className="text-sm sm:text-base font-serif italic text-white leading-relaxed px-4">
                "{generatedEntry.bedtimeAffirmation}"
              </p>
            </div>
          )}

          {/* The Journal Separated into Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] px-1 font-mono uppercase tracking-wider">
              <span>Separated Topics</span>
              <span>{generatedEntry.topics?.length || 3} Sections</span>
            </div>

            {generatedEntry.topics?.map((topic, idx) => (
              <div 
                key={topic.id || idx}
                className="rounded-2xl border border-[#1F1F28] bg-[#121216] p-4 space-y-2 hover:border-[#2C2C38] transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-[#1C1C24] border border-[#2E2E3C] flex items-center justify-center text-[#5E5CE6] text-xs">
                    {topic.icon === 'moon' && <Moon className="h-3.5 w-3.5" />}
                    {topic.icon === 'wind' && <Wind className="h-3.5 w-3.5" />}
                    {topic.icon === 'sparkles' && <Sparkles className="h-3.5 w-3.5" />}
                    {topic.icon === 'stars' && <Sparkles className="h-3.5 w-3.5" />}
                    {topic.icon === 'heart' && <Heart className="h-3.5 w-3.5" />}
                    {(!topic.icon || topic.icon === 'compass') && <Compass className="h-3.5 w-3.5" />}
                  </div>
                  <h4 className="text-xs font-medium text-[#E5E5EA]">
                    {topic.title}
                  </h4>
                </div>

                <p className="text-xs sm:text-sm text-[#AEAEB2] font-light leading-relaxed pl-8">
                  {topic.content}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Action Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToCalendar(generatedEntry.date)}
              className="p-3 rounded-xl border border-[#282834] bg-[#16161C] hover:bg-[#1C1C24] text-xs font-medium text-white flex items-center justify-center gap-2 transition-all"
            >
              <CalendarIcon className="h-4 w-4 text-[#5E5CE6]" />
              View on Calendar
            </button>

            <button
              type="button"
              onClick={() => onOpenReader(generatedEntry)}
              className="p-3 rounded-xl border border-[#282834] bg-[#16161C] hover:bg-[#1C1C24] text-xs font-medium text-white flex items-center justify-center gap-2 transition-all"
            >
              <BookOpen className="h-4 w-4 text-[#FF9F0A]" />
              Bedtime Reader Mode
            </button>

            <button
              type="button"
              onClick={handleResetForNewNight}
              className="p-3 rounded-xl border border-[#282834] bg-[#16161C] hover:bg-[#1C1C24] text-xs font-medium text-[#AEAEB2] hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              New Reflection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
