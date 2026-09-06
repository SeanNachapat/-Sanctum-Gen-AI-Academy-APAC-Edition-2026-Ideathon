import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Clock, 
  Tag, 
  Compass, 
  Check, 
  Lightbulb, 
  Loader2, 
  Copy, 
  Trash2,
  BrainCircuit,
  CornerDownLeft,
  Bot,
  User as UserIcon
} from 'lucide-react';
import Markdown from 'react-markdown';
import type { JournalEntry, ChatMessage } from '../types';
import { subscribeEntryMessages, saveChatMessage, deleteJournalEntry } from '../lib/firestoreService';

interface EntryDetailModalProps {
  userId: string;
  entry: JournalEntry;
  onClose: () => void;
  onEntryDeleted: (entryId: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
  userId,
  entry,
  onClose,
  onEntryDeleted,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'reflection' | 'chat'>('reflection');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time chat messages for this entry
  useEffect(() => {
    const unsubscribe = subscribeEntryMessages(userId, entry.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [userId, entry.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Send a chat message to Gemini
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');
    setIsSending(true);

    try {
      // 1. Save user message in Firestore first
      await saveChatMessage(userId, entry.id, {
        role: 'user',
        text,
      });

      // 2. Call backend Gemini Chat API
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryTitle: entry.title,
          entryContent: entry.content,
          messages: messages.map((m) => ({ role: m.role, text: m.text })),
          userMessage: text,
          tone: entry.toneUsed || 'empathic',
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get Gemini response');
      }

      const data = await res.json();

      // 3. Save Gemini reply in Firestore
      await saveChatMessage(userId, entry.id, {
        role: 'model',
        text: data.reply,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      showToast(`Error communicating with Gemini: ${err?.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(`${entry.title}\n\n${entry.content}`);
    setCopied(true);
    showToast('Entry text copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this journal entry and its conversations?')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteJournalEntry(userId, entry.id);
      showToast('Entry deleted successfully', 'success');
      onEntryDeleted(entry.id);
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Failed to delete: ${err?.message}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md animate-fadeIn">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-[#2C2C2E] bg-[#0D0D0F] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F23] px-6 py-4 bg-[#0D0D0F]">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-[#1C1C1E] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#5E5CE6] border border-[#2C2C2E]">
              {entry.category}
            </span>
            <div className="flex items-center gap-2 text-xs text-[#8E8E93]">
              <Clock className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyContent}
              title="Copy Journal Text"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete Entry"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] text-[#8E8E93] hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              id="close-modal-btn"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation (Overview & AI Reflection vs. Multi-Turn Conversation) */}
        <div className="flex border-b border-[#1F1F23] bg-[#0A0A0B] px-6">
          <button
            id="tab-reflection-view"
            onClick={() => setActiveTab('reflection')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'reflection'
                ? 'border-[#5E5CE6] text-white'
                : 'border-transparent text-[#8E8E93] hover:text-[#D1D1D6]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#5E5CE6]" />
            <span>Entry & AI Reflection</span>
          </button>

          <button
            id="tab-chat-view"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'border-[#5E5CE6] text-white'
                : 'border-transparent text-[#8E8E93] hover:text-[#D1D1D6]'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
            <span>Multi-Turn Chat ({messages.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          
          {activeTab === 'reflection' ? (
            <div className="space-y-8 max-w-4xl mx-auto">
              
              {/* Entry Header */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#F2F2F7] font-serif italic tracking-tight">
                  {entry.title}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {entry.mood && (
                    <span className="rounded-md bg-[#1C1C1E] px-2.5 py-1 text-[#D1D1D6] border border-[#2C2C2E]">
                      Mood: <strong className="text-white capitalize">{entry.mood}</strong>
                    </span>
                  )}
                  {entry.toneUsed && (
                    <span className="rounded-md bg-[#1C1C1E] px-2.5 py-1 text-[#D1D1D6] border border-[#2C2C2E]">
                      Persona: <strong className="text-[#5E5CE6] capitalize">{entry.toneUsed}</strong>
                    </span>
                  )}
                  {entry.tags?.map((t, idx) => (
                    <span key={idx} className="rounded-md bg-[#1C1C1E]/80 px-2 py-1 text-[#8E8E93] border border-[#2C2C2E]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Original Journal Content */}
              <div className="rounded-2xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-6">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366] mb-3">
                  Original Journal Entry
                </h3>
                <div className="text-[#D1D1D6] text-sm leading-relaxed whitespace-pre-wrap font-serif">
                  {entry.content}
                </div>
              </div>

              {/* Gemini AI Reflection Box */}
              {entry.aiReflection ? (
                <div className="rounded-2xl border border-[#2C2C2E] bg-[#1C1C1E]/40 p-6 sm:p-7 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#5E5CE6]" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5E5CE6]/20 text-[#5E5CE6]">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#5E5CE6]">
                        Gemini AI Reflection & Insights
                      </h3>
                    </div>

                    <button
                      onClick={() => setActiveTab('chat')}
                      className="text-xs text-[#5E5CE6] hover:text-[#4745D1] font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ask Follow-Up</span>
                      <span>→</span>
                    </button>
                  </div>

                  {entry.summary && (
                    <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
                      <span className="text-[10px] font-semibold text-[#5E5CE6] uppercase tracking-[0.2em] block mb-1">
                        Summary
                      </span>
                      <p className="text-xs text-[#D1D1D6] leading-relaxed font-sans font-light">
                        {entry.summary}
                      </p>
                    </div>
                  )}

                  {/* Deep Reflection */}
                  <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/80 p-5 font-serif text-sm text-[#D1D1D6] leading-relaxed">
                    {entry.aiReflection}
                  </div>

                  {/* Takeaways & Action Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entry.keyTakeaways && entry.keyTakeaways.length > 0 && (
                      <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
                        <h4 className="text-[10px] font-bold text-[#30D158] uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" />
                          <span>Key Insights</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-[#AEAEB2]">
                          {entry.keyTakeaways.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#30D158] font-bold">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.actionItems && entry.actionItems.length > 0 && (
                      <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-4">
                        <h4 className="text-[10px] font-bold text-[#5E5CE6] uppercase tracking-[0.2em] mb-2.5 flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span>Action Steps</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-[#AEAEB2]">
                          {entry.actionItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-[#5E5CE6] font-bold">→</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#2C2C2E] p-8 text-center bg-[#1C1C1E]/30">
                  <BrainCircuit className="mx-auto h-8 w-8 text-[#636366] mb-2" />
                  <p className="text-xs text-[#8E8E93]">
                    No automated reflection generated during save. You can converse directly in the Multi-Turn Chat tab!
                  </p>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5E5CE6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4745D1] transition-colors cursor-pointer shadow-lg shadow-[#5E5CE6]/20"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Start Discussion with Gemini</span>
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Multi-Turn Chat View */
            <div className="flex h-full flex-col max-w-4xl mx-auto">
              
              {/* Chat Header notice */}
              <div className="mb-4 rounded-xl border border-[#2C2C2E] bg-[#1C1C1E] p-3 text-xs text-[#8E8E93] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#5E5CE6]" />
                  <span>Discussing: <strong className="text-white font-serif italic">{entry.title}</strong></span>
                </div>
                <span className="text-[10px] text-[#636366] font-mono">Firestore Protected</span>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 space-y-4 overflow-y-auto min-h-[300px] max-h-[460px] pr-2 pb-4">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-[#636366]">
                    <MessageSquare className="mx-auto h-8 w-8 mb-2 text-[#636366]" />
                    <p className="text-xs text-[#8E8E93]">No follow-up messages yet.</p>
                    <p className="text-xs text-[#636366] mt-1">
                      Ask Gemini to explore this entry deeper, suggest alternatives, or clarify any thought.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                      {[
                        'Can you help me unpack the main root cause of this?',
                        'What is one alternative perspective I might be overlooking?',
                        'How can I structure a 3-step action plan for tomorrow?'
                      ].map((prompt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(prompt)}
                          className="rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] px-3 py-1.5 text-xs text-[#D1D1D6] hover:border-[#5E5CE6] hover:text-white transition-all text-left cursor-pointer"
                        >
                          💬 "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'model' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#5E5CE6] text-white text-xs mt-0.5">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#5E5CE6] text-white rounded-tr-none'
                            : 'bg-[#1C1C1E] border border-[#2C2C2E] text-[#D1D1D6] rounded-tl-none font-serif'
                        }`}
                      >
                        <div className="markdown-body">
                          <Markdown>{msg.text}</Markdown>
                        </div>
                        <div
                          className={`mt-1.5 text-[10px] ${
                            msg.role === 'user' ? 'text-white/70' : 'text-[#636366]'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2C2C2E] text-white text-xs mt-0.5">
                          <UserIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-[#8E8E93] pl-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5E5CE6]" />
                    <span>Gemini is thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="mt-4 border-t border-[#1F1F23] pt-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    id="chat-user-input"
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Gemini a follow-up or brainstorm ideas..."
                    disabled={isSending}
                    className="flex-1 rounded-xl border border-[#2C2C2E] bg-[#0A0A0B] px-4 py-2.5 text-xs text-white placeholder-[#48484A] focus:border-[#5E5CE6] focus:outline-none disabled:opacity-50"
                  />
                  <button
                    id="send-chat-btn"
                    type="submit"
                    disabled={isSending || !inputMessage.trim()}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5E5CE6] text-white hover:bg-[#4745D1] disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
