import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Calendar, 
  MessageSquare, 
  Trash2, 
  ArrowUpRight, 
  Clock, 
  Tag, 
  Check, 
  Filter, 
  Plus,
  BookOpen,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import type { JournalEntry, ReflectionCategory } from '../types';
import { deleteJournalEntry } from '../lib/firestoreService';

interface EntryHistoryProps {
  userId: string;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewReflection: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EntryHistory: React.FC<EntryHistoryProps> = ({
  userId,
  entries,
  onSelectEntry,
  onNewReflection,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesCategory =
      selectedCategory === 'all' || entry.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this reflection?')) {
      return;
    }

    try {
      setDeletingId(entryId);
      await deleteJournalEntry(userId, entryId);
      showToast('Reflection removed', 'success');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`Error deleting entry: ${err?.message}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const totalWords = entries.reduce(
    (acc, curr) => acc + (curr.content ? curr.content.trim().split(/\s+/).length : 0),
    0
  );

  const totalConversations = entries.reduce(
    (acc, curr) => acc + (curr.messageCount || 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header & Stats Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#636366] font-semibold mb-1">
            Evening Archives
          </div>
          <h1 className="text-2xl font-bold text-[#F2F2F7] tracking-tight font-serif italic sm:text-3xl">
            Reflection History & Archives
          </h1>
          <p className="text-xs text-[#8E8E93] mt-1">
            Browse through your past night reflections, topics, and bedtime blessings.
          </p>
        </div>

        <button
          id="history-new-reflection-btn"
          onClick={onNewReflection}
          className="flex items-center gap-2 rounded-xl bg-[#5E5CE6] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#5E5CE6]/20 hover:bg-[#4745D1] transition-all cursor-pointer w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#636366]">Total Entries</span>
            <BookOpen className="h-4 w-4 text-[#5E5CE6]" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-serif">{entries.length}</p>
        </div>

        <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#30D158]">Words Written</span>
            <TrendingUp className="h-4 w-4 text-[#30D158]" />
          </div>
          <p className="text-2xl font-bold text-[#30D158] mt-2 font-serif">{totalWords.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-purple-400">Gemini Follow-ups</span>
            <BrainCircuit className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 font-serif">{totalConversations}</p>
        </div>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-y border-[#1F1F23] py-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#636366]" />
          <input
            id="search-history-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keywords, insights, tags..."
            className="w-full rounded-xl border border-[#2C2C2E] bg-[#0A0A0B] pl-9 pr-4 py-2 text-xs text-[#D1D1D6] placeholder-[#48484A] focus:border-[#5E5CE6] focus:outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'reflection', label: 'Reflections' },
            { id: 'brainstorm', label: 'Brainstorms' },
            { id: 'daily', label: 'Daily Logs' },
            { id: 'gratitude', label: 'Gratitude' },
            { id: 'challenge', label: 'Challenges' },
            { id: 'creative', label: 'Creative' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#5E5CE6] text-white shadow-sm'
                  : 'bg-[#1C1C1E] text-[#8E8E93] hover:bg-[#2C2C2E] hover:text-[#D1D1D6] border border-[#2C2C2E]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#2C2C2E] p-12 text-center bg-[#1C1C1E]/30">
          <BookOpen className="mx-auto h-10 w-10 text-[#636366] mb-3" />
          <h3 className="text-sm font-semibold text-[#D1D1D6] font-serif">
            {entries.length === 0 ? 'No journal entries yet' : 'No matching entries found'}
          </h3>
          <p className="text-xs text-[#8E8E93] mt-1 max-w-sm mx-auto">
            {entries.length === 0
              ? 'Start your first reflective writing session with Gemini AI insights today.'
              : 'Try clearing your search term or filtering by a different category.'}
          </p>
          {entries.length === 0 && (
            <button
              onClick={onNewReflection}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#5E5CE6] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#4745D1] transition-all cursor-pointer shadow-lg shadow-[#5E5CE6]/20"
            >
              <Plus className="h-4 w-4" />
              <span>Write First Reflection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => {
            const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={entry.id}
                id={`entry-card-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#2C2C2E] bg-[#1C1C1E] p-5 hover:border-[#5E5CE6]/50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-black/40"
              >
                <div>
                  {/* Card Header: Category & Date */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      {entry.emotionColor && (
                        <span 
                          className="h-2.5 w-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: entry.emotionColor }}
                          title={entry.emotion || entry.emotionColorName}
                        />
                      )}
                      <span className="rounded-md bg-[#0A0A0B] border border-[#2C2C2E] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#5E5CE6]">
                        {entry.emotion || entry.category}
                      </span>
                      {entry.topics && entry.topics.length > 0 && (
                        <span className="text-[10px] text-[#8E8E93] bg-[#141418] px-1.5 py-0.5 rounded border border-[#222228]">
                          {entry.topics.length} topics
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#636366] font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{entry.date || dateStr}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#F2F2F7] font-serif italic group-hover:text-white transition-colors line-clamp-1">
                    {entry.title}
                  </h3>

                  {/* Summary or Snippet */}
                  <p className="mt-2 text-xs text-[#8E8E93] leading-relaxed line-clamp-3 font-serif">
                    {entry.summary || entry.content}
                  </p>

                  {/* AI Reflection Indicator */}
                  {entry.aiReflection && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#5E5CE6] font-semibold">
                      <Sparkles className="h-3 w-3" />
                      <span>Gemini reflection & insights attached</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Tags, Messages count, Actions */}
                <div className="mt-4 pt-3 border-t border-[#1F1F23] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {entry.messageCount && entry.messageCount > 0 ? (
                      <span className="flex items-center gap-1 text-[#30D158] text-[10px] uppercase tracking-wider font-semibold">
                        <MessageSquare className="h-3 w-3" />
                        <span>{entry.messageCount} messages</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#636366] font-mono">
                        {entry.content.split(/\s+/).length} words
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDelete(e, entry.id)}
                      disabled={deletingId === entry.id}
                      title="Delete reflection"
                      className="p-1.5 rounded-lg text-[#636366] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex items-center gap-1 text-[#5E5CE6] text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>View</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
