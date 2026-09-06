import type { EmotionColorConfig } from '../types';

export const EMOTION_PALETTE: Record<string, EmotionColorConfig> = {
  peaceful: {
    key: 'peaceful',
    label: 'Peaceful & Serene',
    color: '#5E5CE6',
    bgClass: 'bg-[#5E5CE6]/15',
    textClass: 'text-[#5E5CE6]',
    borderClass: 'border-[#5E5CE6]/30',
    description: 'A calm, tranquil twilight state of stillness and inner quiet.'
  },
  grateful: {
    key: 'grateful',
    label: 'Grateful & Warm',
    color: '#FF9F0A',
    bgClass: 'bg-[#FF9F0A]/15',
    textClass: 'text-[#FF9F0A]',
    borderClass: 'border-[#FF9F0A]/30',
    description: 'Appreciation for the gentle moments, good food, and kind souls.'
  },
  joyful: {
    key: 'joyful',
    label: 'Joyful & Content',
    color: '#30D158',
    bgClass: 'bg-[#30D158]/15',
    textClass: 'text-[#30D158]',
    borderClass: 'border-[#30D158]/30',
    description: 'Feeling accomplished, happy, or refreshed in spirit.'
  },
  tender: {
    key: 'tender',
    label: 'Loved & Tender',
    color: '#FF375F',
    bgClass: 'bg-[#FF375F]/15',
    textClass: 'text-[#FF375F]',
    borderClass: 'border-[#FF375F]/30',
    description: 'Deep warmth from meaningful human connection and affection.'
  },
  thoughtful: {
    key: 'thoughtful',
    label: 'Thoughtful & Pensive',
    color: '#64D2FF',
    bgClass: 'bg-[#64D2FF]/15',
    textClass: 'text-[#64D2FF]',
    borderClass: 'border-[#64D2FF]/30',
    description: 'Observing life with wonder, curiosity, or quiet reflection.'
  },
  overwhelmed: {
    key: 'overwhelmed',
    label: 'Overwhelmed & Full',
    color: '#BF5AF2',
    bgClass: 'bg-[#BF5AF2]/15',
    textClass: 'text-[#BF5AF2]',
    borderClass: 'border-[#BF5AF2]/30',
    description: 'A lot processed today; ready to release sensory noise.'
  },
  restless: {
    key: 'restless',
    label: 'Restless & Unsettled',
    color: '#FF453A',
    bgClass: 'bg-[#FF453A]/15',
    textClass: 'text-[#FF453A]',
    borderClass: 'border-[#FF453A]/30',
    description: 'Tension or racing thoughts being given space to soften.'
  },
  exhausted: {
    key: 'exhausted',
    label: 'Weary & Resting',
    color: '#8E8E93',
    bgClass: 'bg-[#8E8E93]/15',
    textClass: 'text-[#8E8E93]',
    borderClass: 'border-[#8E8E93]/30',
    description: 'Physical or mental fatigue calling for deep surrender to sleep.'
  }
};

/**
 * Match a raw emotion string to the closest EmotionColorConfig
 */
export function getEmotionConfig(emotionStr?: string): EmotionColorConfig {
  if (!emotionStr) return EMOTION_PALETTE.peaceful;
  
  const lower = emotionStr.toLowerCase().trim();
  
  for (const [key, config] of Object.entries(EMOTION_PALETTE)) {
    if (lower.includes(key) || lower.includes(config.label.toLowerCase())) {
      return config;
    }
  }
  
  // Secondary keywords mapping
  if (lower.includes('calm') || lower.includes('serene') || lower.includes('tranquil') || lower.includes('quiet')) {
    return EMOTION_PALETTE.peaceful;
  }
  if (lower.includes('thank') || lower.includes('warm') || lower.includes('bless') || lower.includes('appreciat')) {
    return EMOTION_PALETTE.grateful;
  }
  if (lower.includes('happy') || lower.includes('good') || lower.includes('content') || lower.includes('energized') || lower.includes('light')) {
    return EMOTION_PALETTE.joyful;
  }
  if (lower.includes('love') || lower.includes('tender') || lower.includes('sweet') || lower.includes('connect')) {
    return EMOTION_PALETTE.tender;
  }
  if (lower.includes('think') || lower.includes('wonder') || lower.includes('nostalgic') || lower.includes('curious') || lower.includes('introspect')) {
    return EMOTION_PALETTE.thoughtful;
  }
  if (lower.includes('busy') || lower.includes('overwhelm') || lower.includes('stress') || lower.includes('heavy') || lower.includes('crowded')) {
    return EMOTION_PALETTE.overwhelmed;
  }
  if (lower.includes('anxious') || lower.includes('worry') || lower.includes('restless') || lower.includes('tense') || lower.includes('frustrat')) {
    return EMOTION_PALETTE.restless;
  }
  if (lower.includes('tired') || lower.includes('exhaust') || lower.includes('sleepy') || lower.includes('drained') || lower.includes('weary')) {
    return EMOTION_PALETTE.exhausted;
  }

  return EMOTION_PALETTE.peaceful;
}

/**
 * Get color hex code for any entry
 */
export function getEntryColor(entry: { emotionColor?: string; emotion?: string; mood?: string; emotionColors?: string[] }): string {
  if (entry.emotionColors && entry.emotionColors.length > 0 && entry.emotionColors[0].startsWith('#')) {
    return entry.emotionColors[0];
  }
  if (entry.emotionColor && entry.emotionColor.startsWith('#')) {
    return entry.emotionColor;
  }
  return getEmotionConfig(entry.emotion || entry.mood).color;
}

/**
 * Builds a CSS linear-gradient string from an array of hex colors
 */
export function buildGradientFromColors(colors: string[]): string {
  if (!colors || colors.length === 0) {
    return 'linear-gradient(135deg, #5E5CE6 0%, #7B79FF 100%)';
  }
  if (colors.length === 1) {
    const c = colors[0];
    return `linear-gradient(135deg, ${c} 0%, ${c}cc 100%)`;
  }
  const stops = colors.map((color, idx) => {
    const pct = Math.round((idx / (colors.length - 1)) * 100);
    return `${color} ${pct}%`;
  }).join(', ');
  return `linear-gradient(135deg, ${stops})`;
}

/**
 * Resolve an array of hex colors for a journal entry
 */
export function getEntryColors(entry: {
  emotionColors?: string[];
  emotionGradient?: string;
  emotionColor?: string;
  emotions?: string[];
  emotion?: string;
  mood?: string;
}): string[] {
  if (entry.emotionColors && Array.isArray(entry.emotionColors) && entry.emotionColors.length > 0) {
    return entry.emotionColors.filter(c => typeof c === 'string' && c.startsWith('#'));
  }

  if (entry.emotions && Array.isArray(entry.emotions) && entry.emotions.length > 0) {
    return entry.emotions.map(e => getEmotionConfig(e).color);
  }

  // Check if emotion string contains multiple comma-separated or "&" joined feelings
  if (entry.emotion && (entry.emotion.includes(',') || entry.emotion.includes('&') || entry.emotion.includes('/'))) {
    const parts = entry.emotion.split(/[,&/]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.map(p => getEmotionConfig(p).color);
    }
  }

  return [getEntryColor(entry)];
}

/**
 * Get CSS gradient string for any entry
 */
export function getEntryGradient(entry: {
  emotionGradient?: string;
  emotionColors?: string[];
  emotionColor?: string;
  emotions?: string[];
  emotion?: string;
  mood?: string;
}): string {
  if (entry.emotionGradient && entry.emotionGradient.startsWith('linear-gradient')) {
    return entry.emotionGradient;
  }
  const colors = getEntryColors(entry);
  return buildGradientFromColors(colors);
}

/**
 * Generate gradient and metadata from a list of emotion palette keys
 */
export function generateGradientFromKeys(keys: string[]): {
  gradient: string;
  colors: string[];
  labels: string[];
  name: string;
} {
  const validKeys = keys.filter(k => EMOTION_PALETTE[k]);
  const activeKeys = validKeys.length > 0 ? validKeys : ['peaceful'];
  
  const colors = activeKeys.map(k => EMOTION_PALETTE[k].color);
  const labels = activeKeys.map(k => EMOTION_PALETTE[k].label);
  const names = activeKeys.map(k => EMOTION_PALETTE[k].label.split('&')[0].trim());
  
  const gradient = buildGradientFromColors(colors);
  const name = names.join(' & ');

  return {
    gradient,
    colors,
    labels,
    name
  };
}
