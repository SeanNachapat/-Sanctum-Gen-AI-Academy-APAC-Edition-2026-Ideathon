import React, { useState } from 'react';
import { X, Moon, Sparkles, Wind, Heart, Compass, Volume2, VolumeX } from 'lucide-react';
import type { JournalEntry } from '../types';
import { getEntryColor, getEntryGradient, getEmotionConfig } from '../lib/emotionColors';

interface BedtimeReaderModalProps {
  entry: JournalEntry;
  onClose: () => void;
}

export const BedtimeReaderModal: React.FC<BedtimeReaderModalProps> = ({ entry, onClose }) => {
  const [ambientSound, setAmbientSound] = useState(false);
  const emotionColor = getEntryColor(entry);
  const emotionGradient = getEntryGradient(entry);

  return (
    <div className="fixed inset-0 z-50 bg-[#060608]/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-fadeIn overflow-y-auto">
      {/* Top Header Bar */}
      <div className="max-w-2xl w-full mx-auto flex items-center justify-between py-2 border-b border-[#1A1A22]">
        <div className="flex items-center gap-2.5">
          <div 
            className="h-7 w-7 rounded-full flex items-center justify-center shadow-sm"
            style={{ background: emotionGradient }}
          >
            <Moon className="h-3.5 w-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
          </div>
          <span className="text-xs font-mono text-[#AEAEB2] uppercase tracking-wider">
            Bedtime Sanctuary • {entry.date || new Date(entry.createdAt).toISOString().split('T')[0]}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-[#16161E] text-[#8E8E93] hover:text-white border border-[#262634] transition-colors"
          title="Close Reader Mode"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Reader Body */}
      <div className="max-w-xl w-full mx-auto my-auto py-8 sm:py-12 space-y-8 text-center sm:text-left">
        
        {/* Title & Daily Emotion Badge */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs font-medium text-white shadow-sm"
              style={{ 
                background: emotionGradient,
                borderColor: 'rgba(255, 255, 255, 0.25)'
              }}
            >
              <Moon className="h-3 w-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" />
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {entry.emotion || entry.emotionColorName || 'Serene'}
              </span>
            </div>

            {entry.emotions && entry.emotions.length > 1 && (
              <div className="flex items-center gap-1">
                {entry.emotions.map((emo, idx) => {
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

          <h1 className="text-2xl sm:text-3xl font-serif text-white font-medium tracking-tight leading-snug">
            {entry.title}
          </h1>
        </div>

        {/* Night Affirmation / Blessing */}
        {entry.bedtimeAffirmation && (
          <div className="p-6 rounded-3xl bg-[#0D0D14] border border-[#1E1E2C] text-center space-y-2">
            <span className="text-[10px] font-mono text-[#5E5CE6] uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Moon className="h-3 w-3" />
              Sleep Blessing
            </span>
            <p className="text-base sm:text-lg font-serif italic text-[#E5E5EA] leading-relaxed">
              "{entry.bedtimeAffirmation}"
            </p>
          </div>
        )}

        {/* The Topics */}
        {entry.topics && entry.topics.length > 0 ? (
          <div className="space-y-6 text-left">
            {entry.topics.map((topic, idx) => (
              <div 
                key={topic.id || idx}
                className="space-y-2 border-b border-[#1A1A22] pb-6 last:border-b-0"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-[#AEAEB2]">
                  {topic.icon === 'moon' && <Moon className="h-3.5 w-3.5 text-[#5E5CE6]" />}
                  {topic.icon === 'wind' && <Wind className="h-3.5 w-3.5 text-[#64D2FF]" />}
                  {topic.icon === 'sparkles' && <Sparkles className="h-3.5 w-3.5 text-[#FF9F0A]" />}
                  {topic.icon === 'heart' && <Heart className="h-3.5 w-3.5 text-[#FF375F]" />}
                  {(!topic.icon || topic.icon === 'compass') && <Compass className="h-3.5 w-3.5 text-[#30D158]" />}
                  <span className="text-white font-serif text-sm sm:text-base">{topic.title}</span>
                </div>

                <p className="text-sm sm:text-base text-[#C7C7CC] font-light leading-relaxed pl-6">
                  {topic.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm sm:text-base text-[#C7C7CC] font-light leading-relaxed text-left">
            {entry.content}
          </div>
        )}
      </div>

      {/* Gentle Closing Whisper */}
      <div className="max-w-xl w-full mx-auto text-center py-4 border-t border-[#14141C]">
        <p className="text-xs text-[#636366] font-light">
          Rest deeply. Tomorrow will welcome you with fresh eyes.
        </p>
      </div>
    </div>
  );
};
