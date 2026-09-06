export type ReflectionCategory =
  | 'reflection'
  | 'brainstorm'
  | 'daily'
  | 'gratitude'
  | 'challenge'
  | 'creative';

export type ReflectionTone =
  | 'empathic'
  | 'analytical'
  | 'philosophical'
  | 'action_oriented'
  | 'creative';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface JournalTopic {
  id: string;
  title: string;
  icon?: string;
  content: string;
}

export interface EmotionColorConfig {
  key: string;
  label: string;
  color: string; // e.g. '#5E5CE6'
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

export interface StagedReflectionInput {
  emotion: string;
  emotions?: string[]; // Multiple selected feelings
  energyLevel: string;
  highlights: string;
  tags: string[];
  lettingGo: string;
  gratitude: string;
  date: string; // YYYY-MM-DD
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: ReflectionCategory;
  mood?: string;
  emotion?: string;
  emotions?: string[]; // Multiple selected feelings
  emotionColor?: string; // Primary hex color code
  emotionColors?: string[]; // Array of hex colors for gradient blend
  emotionGradient?: string; // CSS linear-gradient string
  emotionColorName?: string; // e.g. 'Twilight Indigo & Starlight Amber'
  date?: string; // YYYY-MM-DD
  topics?: JournalTopic[];
  bedtimeAffirmation?: string;
  tags?: string[];
  summary?: string;
  keyTakeaways?: string[];
  aiReflection?: string;
  actionItems?: string[];
  toneUsed?: ReflectionTone;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
  stagedInput?: Partial<StagedReflectionInput>;
}

export interface ReflectionResponse {
  title?: string;
  summary: string;
  reflection: string;
  emotion?: string;
  emotions?: string[];
  emotionColor?: string;
  emotionColors?: string[];
  emotionGradient?: string;
  emotionColorName?: string;
  topics?: JournalTopic[];
  bedtimeAffirmation?: string;
  keyTakeaways: string[];
  actionItems: string[];
  suggestedFollowUps: string[];
}

