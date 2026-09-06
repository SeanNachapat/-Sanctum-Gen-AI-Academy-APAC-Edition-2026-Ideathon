import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { db, sanitizePayload } from './firebase';
import type { JournalEntry, ChatMessage } from '../types';

/**
 * Save or update a journal reflection entry in the user's isolated collection
 * Path: /users/{userId}/entries/{entryId}
 */
export async function saveJournalEntry(
  userId: string, 
  entry: Partial<JournalEntry> & { title: string; content: string }
): Promise<JournalEntry> {
  if (!userId) {
    throw new Error('User ID is required to save entry');
  }

  const entryId = entry.id || `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const now = Date.now();

  const completeEntry: JournalEntry = {
    id: entryId,
    userId,
    title: entry.title.trim() || 'Untitled Reflection',
    content: entry.content.trim(),
    category: entry.category || 'reflection',
    mood: entry.mood || 'neutral',
    tags: entry.tags || [],
    summary: entry.summary || '',
    keyTakeaways: entry.keyTakeaways || [],
    aiReflection: entry.aiReflection || '',
    actionItems: entry.actionItems || [],
    toneUsed: entry.toneUsed || 'empathic',
    createdAt: entry.createdAt || now,
    updatedAt: now,
    messageCount: entry.messageCount || 0
  };

  const payload = sanitizePayload(completeEntry);
  await setDoc(entryRef, payload, { merge: true });

  return completeEntry;
}

/**
 * Delete a user's journal entry
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

/**
 * Subscribe to real-time updates for all user entries (strictly isolated by userId)
 */
export function subscribeUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalEntry;
        entries.push({
          ...data,
          id: docSnap.id
        });
      });
      onUpdate(entries);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch a single entry by ID
 */
export async function getJournalEntry(userId: string, entryId: string): Promise<JournalEntry | null> {
  if (!userId || !entryId) return null;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  const snap = await getDoc(entryRef);
  if (!snap.exists()) return null;
  return { ...snap.data(), id: snap.id } as JournalEntry;
}

/**
 * Save a chat message in the entry's conversation sub-collection
 * Path: /users/{userId}/entries/{entryId}/messages/{messageId}
 */
export async function saveChatMessage(
  userId: string,
  entryId: string,
  message: { role: 'user' | 'model'; text: string }
): Promise<ChatMessage> {
  if (!userId || !entryId) {
    throw new Error('User ID and Entry ID are required');
  }

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const messageRef = doc(db, 'users', userId, 'entries', entryId, 'messages', messageId);
  
  const chatMsg: ChatMessage = {
    id: messageId,
    role: message.role,
    text: message.text,
    timestamp: Date.now()
  };

  await setDoc(messageRef, sanitizePayload(chatMsg));

  // Increment message count on parent entry
  try {
    const entryRef = doc(db, 'users', userId, 'entries', entryId);
    const snap = await getDoc(entryRef);
    if (snap.exists()) {
      const currentCount = snap.data().messageCount || 0;
      await updateDoc(entryRef, {
        messageCount: currentCount + 1,
        updatedAt: Date.now()
      });
    }
  } catch (err) {
    console.warn('Could not update message count on entry:', err);
  }

  return chatMsg;
}

/**
 * Subscribe to messages in an entry conversation
 */
export function subscribeEntryMessages(
  userId: string,
  entryId: string,
  onUpdate: (messages: ChatMessage[]) => void
): () => void {
  if (!userId || !entryId) {
    onUpdate([]);
    return () => {};
  }

  const messagesRef = collection(db, 'users', userId, 'entries', entryId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ ...docSnap.data(), id: docSnap.id } as ChatMessage);
      });
      onUpdate(msgs);
    },
    (err) => {
      console.error('Error fetching chat messages:', err);
    }
  );
}
