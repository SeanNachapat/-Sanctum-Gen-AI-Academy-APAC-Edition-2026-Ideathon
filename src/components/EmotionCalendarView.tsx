import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Moon, 
  Wind, 
  Heart, 
  BookOpen, 
  MessageSquare, 
  Trash2, 
  Plus,
  Info,
  Compass
} from 'lucide-react';
import type { JournalEntry } from '../types';
import { EMOTION_PALETTE, getEntryColor, getEntryGradient, getEmotionConfig } from '../lib/emotionColors';

interface EmotionCalendarViewProps {
  entries: JournalEntry[];
  initialDate?: string;
  onSelectDateToReflect: (dateStr: string) => void;
  onOpenConversation: (entry: JournalEntry) => void;
  onOpenReader: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmotionCalendarView: React.FC<EmotionCalendarViewProps> = ({
  entries,
  initialDate,
  onSelectDateToReflect,
  onOpenConversation,
  onOpenReader,
  onDeleteEntry,
  showToast,
}) => {
  // Calendar current browsing month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return d.getFullYear();
    }
    return today.getFullYear();
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (initialDate) {
      const d = new Date(initialDate);
      if (!isNaN(d.getTime())) return d.getMonth();
    }
    return today.getMonth();
  });

  // Selected date string (YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (initialDate) return initialDate;
    return today.toISOString().split('T')[0];
  });

  // Map of YYYY-MM-DD to JournalEntry
  const dateEntryMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    for (const entry of entries) {
      let key = entry.date;
      if (!key && entry.createdAt) {
        key = new Date(entry.createdAt).toISOString().split('T')[0];
      }
      if (key && !map.has(key)) {
        map.set(key, entry);
      }
    }
    return map;
  }, [entries]);

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Entry for currently selected date
  const selectedEntry = dateEntryMap.get(selectedDateStr);

  // Monthly stats & distribution
  const monthStats = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthEntries: JournalEntry[] = [];
    const emotionCounts: Record<string, number> = {};

    dateEntryMap.forEach((entry, dateStr) => {
      if (dateStr.startsWith(prefix)) {
        monthEntries.push(entry);
        const config = getEmotionConfig(entry.emotion || entry.mood);
        emotionCounts[config.key] = (emotionCounts[config.key] || 0) + 1;
      }
    });

    return {
      total: monthEntries.length,
      emotionCounts
    };
  }, [dateEntryMap, currentYear, currentMonth]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      
      {/* Calendar Card Container */}
      <div className="bg-[#121216] border border-[#1F1F26] rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/60 relative overflow-hidden">
        {/* Subtle Ambient Night Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5E5CE6]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        {/* Month Header & Controls */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E8E93] block">
              Emotional Landscape
            </span>
            <h2 className="text-xl font-serif font-medium text-white tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2.5 py-1 text-[11px] font-mono text-[#AEAEB2] hover:text-white bg-[#1C1C22] border border-[#2A2A34] rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-[#1C1C22] border border-[#2A2A34] text-[#AEAEB2] hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-[#1C1C22] border border-[#2A2A34] text-[#AEAEB2] hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={idx} className="text-[10px] font-mono font-medium text-[#636366] uppercase py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-12 sm:h-14 rounded-xl opacity-0 pointer-events-none" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const entry = dateEntryMap.get(dateStr);
            const isSelected = selectedDateStr === dateStr;
            const isToday = today.toISOString().split('T')[0] === dateStr;

            const emotionColor = entry ? getEntryColor(entry) : null;
            const emotionGradient = entry ? getEntryGradient(entry) : null;
            const emotionConfig = entry ? getEmotionConfig(entry.emotion || entry.mood) : null;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDateStr(dateStr)}
                className={`relative h-12 sm:h-14 rounded-2xl border flex flex-col items-center justify-between p-1.5 transition-all group ${
                  isSelected
                    ? 'border-[#5E5CE6] bg-[#1C1C28] shadow-lg shadow-[#5E5CE6]/15 scale-[1.03] z-10'
                    : isToday
                    ? 'border-[#3E3E50] bg-[#16161C] hover:border-[#5E5CE6]/60'
                    : 'border-[#1C1C22] bg-[#101014] hover:border-[#2C2C36] hover:bg-[#141418]'
                }`}
              >
                {/* Day Number */}
                <span className={`text-[11px] font-mono leading-none ${
                  isSelected ? 'text-white font-semibold' : isToday ? 'text-[#5E5CE6] font-medium' : 'text-[#AEAEB2]'
                }`}>
                  {dayNum}
                </span>

                {/* Emotion Color Gradient Capsule / Dot */}
                {entry && emotionGradient ? (
                  <div className="flex flex-col items-center">
                    <span
                      className="h-2.5 w-4 sm:h-3 sm:w-5 rounded-full transition-transform group-hover:scale-125 shadow-sm border border-white/20"
                      style={{ 
                        background: emotionGradient,
                        boxShadow: `0 0 8px ${emotionColor || '#5E5CE6'}70` 
                      }}
                      title={`${entry.emotion || emotionConfig?.label || 'Emotion'} • ${entry.title}`}
                    />
                  </div>
                ) : (
                  <span className="h-1 w-1 rounded-full bg-transparent" />
                )}

                {/* Micro Today Indicator */}
                {isToday && !entry && (
                  <span className="h-1 w-1 rounded-full bg-[#5E5CE6]/60" />
                )}
                {!isToday && !entry && (
                  <span className="h-1 w-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Monthly Emotion Spectrum Bar */}
        {monthStats.total > 0 && (
          <div className="mt-6 pt-5 border-t border-[#1C1C24]">
            <div className="flex items-center justify-between text-[11px] text-[#8E8E93] mb-2 font-mono">
              <span>Monthly Harmony • {monthStats.total} Nights Recorded</span>
              <span>{Math.round((monthStats.total / daysInMonth) * 100)}% coverage</span>
            </div>

            {/* Segmented Color Bar */}
            <div className="h-2 w-full rounded-full bg-[#1C1C24] overflow-hidden flex">
              {Object.entries(monthStats.emotionCounts).map(([key, count]) => {
                const config = EMOTION_PALETTE[key];
                if (!config) return null;
                const widthPct = (count / monthStats.total) * 100;
                return (
                  <div
                    key={key}
                    style={{ 
                      width: `${widthPct}%`,
                      backgroundColor: config.color 
                    }}
                    title={`${config.label}: ${count} nights`}
                    className="h-full transition-all"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SELECTED DATE DETAIL SECTION */}
      <div className="animate-fadeIn">
        {selectedEntry ? (
          <div className="bg-[#121216] border border-[#1F1F28] rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            {/* Header: Date + Emotion Color Badge */}
            <div className="flex items-start justify-between gap-3 border-b border-[#1C1C24] pb-4">
              <div>
                <span className="text-[11px] font-mono text-[#8E8E93] uppercase tracking-wider block">
                  Night of {selectedEntry.date || selectedDateStr}
                </span>
                <h3 className="text-lg font-serif font-medium text-white mt-0.5">
                  {selectedEntry.title}
                </h3>
              </div>

              {/* Glowing Emotion Gradient Badge */}
              <div className="flex flex-wrap items-center gap-1.5">
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm text-white"
                  style={{
                    background: getEntryGradient(selectedEntry),
                    borderColor: 'rgba(255, 255, 255, 0.25)'
                  }}
                >
                  <Moon className="h-3 w-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
                  <span className="text-xs font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {selectedEntry.emotion || selectedEntry.emotionColorName || 'Serene'}
                  </span>
                </div>

                {selectedEntry.emotions && selectedEntry.emotions.length > 1 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {selectedEntry.emotions.map((emo, idx) => {
                      const conf = getEmotionConfig(emo);
                      return (
                        <span 
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[#181822] border border-[#282836] text-[#D1D1D6] flex items-center gap-1"
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: conf.color }} />
                          {emo}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bedtime Affirmation / Night Blessing Quote */}
            {selectedEntry.bedtimeAffirmation && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161622] to-[#12121A] border border-[#242436] text-center space-y-1">
                <div className="text-[10px] text-[#AEAEB2] uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
                  <Moon className="h-3 w-3 text-[#5E5CE6]" />
                  Bedtime Whisper
                </div>
                <p className="text-xs sm:text-sm font-serif italic text-white leading-relaxed px-2">
                  "{selectedEntry.bedtimeAffirmation}"
                </p>
              </div>
            )}

            {/* Separated Topics */}
            {selectedEntry.topics && selectedEntry.topics.length > 0 ? (
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#636366] block">
                  Separated Topics
                </span>

                {selectedEntry.topics.map((topic, i) => (
                  <div 
                    key={topic.id || i}
                    className="p-4 rounded-2xl bg-[#15151A] border border-[#202028] space-y-1.5 hover:border-[#2C2C36] transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-md bg-[#1C1C24] flex items-center justify-center text-[#5E5CE6] text-xs">
                        {topic.icon === 'moon' && <Moon className="h-3 w-3" />}
                        {topic.icon === 'wind' && <Wind className="h-3 w-3" />}
                        {topic.icon === 'sparkles' && <Sparkles className="h-3 w-3" />}
                        {topic.icon === 'stars' && <Sparkles className="h-3 w-3" />}
                        {topic.icon === 'heart' && <Heart className="h-3 w-3" />}
                        {(!topic.icon || topic.icon === 'compass') && <Compass className="h-3 w-3" />}
                      </div>
                      <h4 className="text-xs font-medium text-[#E5E5EA]">
                        {topic.title}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-[#AEAEB2] font-light leading-relaxed pl-7">
                      {topic.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback for entries without structured topics */
              <div className="p-4 rounded-2xl bg-[#15151A] border border-[#202028] text-xs text-[#AEAEB2] leading-relaxed">
                {selectedEntry.content}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1C1C24] gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenReader(selectedEntry)}
                  className="px-3.5 py-2 rounded-xl bg-[#1A1A22] border border-[#282834] text-xs font-medium text-white hover:border-[#FF9F0A]/50 flex items-center gap-1.5 transition-all"
                >
                  <BookOpen className="h-3.5 w-3.5 text-[#FF9F0A]" />
                  Bedtime Reader
                </button>

                <button
                  type="button"
                  onClick={() => onOpenConversation(selectedEntry)}
                  className="px-3.5 py-2 rounded-xl bg-[#1A1A22] border border-[#282834] text-xs font-medium text-white hover:border-[#5E5CE6]/50 flex items-center gap-1.5 transition-all"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-[#5E5CE6]" />
                  Bedtime Chat
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this bedtime reflection permanently?')) {
                    onDeleteEntry(selectedEntry.id);
                    showToast('Reflection removed', 'info');
                  }
                }}
                className="p-2 rounded-xl text-[#636366] hover:text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors"
                title="Delete reflection"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty state for days with no entry */
          <div className="bg-[#121216] border border-[#1F1F28] rounded-3xl p-6 sm:p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-[#181820] border border-[#262634] flex items-center justify-center mx-auto text-[#636366]">
              <Moon className="h-5 w-5" />
            </div>

            <div>
              <span className="text-[11px] font-mono text-[#8E8E93] uppercase tracking-wider block">
                {selectedDateStr}
              </span>
              <h3 className="text-sm font-medium text-white mt-1">
                No reflection recorded for this night
              </h3>
              <p className="text-xs text-[#8E8E93] max-w-xs mx-auto mt-1 font-light leading-relaxed">
                Take a quiet moment to look back on this day and weave it into peaceful topics.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelectDateToReflect(selectedDateStr)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5E5CE6] hover:bg-[#6E6CFF] text-white text-xs font-medium shadow-lg shadow-[#5E5CE6]/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              Reflect on This Night
            </button>
          </div>
        )}
      </div>

      {/* EMOTION COLOR PALETTE GUIDE */}
      <div className="bg-[#121216]/60 border border-[#1F1F24] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-[#8E8E93]">
          <span className="font-mono uppercase tracking-wider text-[10px]">Daily Emotion Palette Guide</span>
          <span className="text-[11px]">8 Mindful Colors</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(EMOTION_PALETTE).map(([key, item]) => (
            <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-[#14141A] border border-[#1E1E26]">
              <span 
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-[#D1D1D6] truncate">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
