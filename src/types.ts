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

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: ReflectionCategory;
  mood?: string;
  tags?: string[];
  summary?: string;
  keyTakeaways?: string[];
  aiReflection?: string;
  actionItems?: string[];
  toneUsed?: ReflectionTone;
  createdAt: number;
  updatedAt: number;
  messageCount?: number;
}

export interface ReflectionResponse {
  summary: string;
  reflection: string;
  keyTakeaways: string[];
  actionItems: string[];
  suggestedFollowUps: string[];
}
