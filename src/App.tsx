import React, { useState, useEffect } from 'react';
import { subscribeAuthState, signInWithGoogle, logOut, type User } from './lib/firebase';
import { subscribeUserEntries, deleteJournalEntry } from './lib/firestoreService';
import type { UserProfile, JournalEntry } from './types';
import { Navbar, type NavView } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { BedtimeStagedReflection } from './components/BedtimeStagedReflection';
import { EmotionCalendarView } from './components/EmotionCalendarView';
import { BedtimeReaderModal } from './components/BedtimeReaderModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { JournalEditor } from './components/JournalEditor';
import { EntryHistory } from './components/EntryHistory';
import { EntryDetailModal } from './components/EntryDetailModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<NavView>('winddown');
  
  // Entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [readerEntry, setReaderEntry] = useState<JournalEntry | null>(null);
  const [targetCalendarDate, setTargetCalendarDate] = useState<string | undefined>(undefined);
  
  // Modals & UI state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeAuthState((user: User | null) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        setCurrentUser(null);
        setEntries([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore real-time updates when user is authenticated
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeUserEntries(
      currentUser.uid,
      (userEntries) => {
        setEntries(userEntries);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        showToast('Error syncing entries from Firestore', 'error');
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      showToast(`Welcome back, ${user.displayName || 'Journaler'}!`, 'success');
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        showToast(err?.message || 'Authentication failed', 'error');
      }
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      showToast('Signed out safely', 'info');
      setCurrentView('winddown');
    } catch (err: any) {
      console.error('Sign out error:', err);
      showToast('Failed to sign out', 'error');
    }
  };

  const handleOpenConversation = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  const handleOpenReader = (entry: JournalEntry) => {
    setReaderEntry(entry);
  };

  const handleEntryDeleted = async (deletedId: string) => {
    if (currentUser?.uid) {
      try {
        await deleteJournalEntry(currentUser.uid, deletedId);
      } catch (e) {
        console.warn('Delete in firestore failed or already removed:', e);
      }
    }
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    if (selectedEntry?.id === deletedId) {
      setSelectedEntry(null);
    }
    if (readerEntry?.id === deletedId) {
      setReaderEntry(null);
    }
  };

  const handleNavigateToCalendar = (date?: string) => {
    setTargetCalendarDate(date);
    setCurrentView('calendar');
  };

  const handleSelectDateToReflect = (dateStr: string) => {
    setCurrentView('winddown');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0B] text-[#D1D1D6]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5E5CE6]" />
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#636366] font-medium">Verifying Firebase Authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] antialiased flex flex-col font-sans relative selection:bg-[#5E5CE6]/30 selection:text-[#5E5CE6]">
      {/* Subtle Dot Matrix Ambiance */}
      <div className="absolute inset-0 bg-sophisticated-dots opacity-[0.07] pointer-events-none -z-0" />
      
      {/* Navigation Bar */}
      <div className="relative z-40">
        <Navbar
          user={currentUser}
          currentView={currentView}
          onViewChange={setCurrentView}
          onNewReflection={() => {
            setSelectedEntry(null);
            setCurrentView('winddown');
          }}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Viewport */}
      <main className="flex-1 relative z-10 pb-20 sm:pb-8">
        {!currentUser ? (
          <LandingHero
            onSignIn={handleSignIn}
          />
        ) : (
          <div>
            {/* 1. Mobile-friendly Staged Bedtime Wind-Down */}
            {(currentView === 'winddown') && (
              <BedtimeStagedReflection
                userId={currentUser.uid}
                onSaveSuccess={(saved) => {
                  setEntries((prev) => {
                    const idx = prev.findIndex((e) => e.id === saved.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = saved;
                      return updated;
                    }
                    return [saved, ...prev];
                  });
                }}
                onNavigateToCalendar={handleNavigateToCalendar}
                onOpenReader={handleOpenReader}
                showToast={showToast}
              />
            )}

            {/* 2. Daily Emotion Color Calendar */}
            {currentView === 'calendar' && (
              <EmotionCalendarView
                entries={entries}
                initialDate={targetCalendarDate}
                onSelectDateToReflect={handleSelectDateToReflect}
                onOpenConversation={handleOpenConversation}
                onOpenReader={handleOpenReader}
                onDeleteEntry={handleEntryDeleted}
                showToast={showToast}
              />
            )}

            {/* 3. Past Nights Archive */}
            {currentView === 'history' && (
              <EntryHistory
                userId={currentUser.uid}
                entries={entries}
                onSelectEntry={(entry) => setSelectedEntry(entry)}
                onNewReflection={() => setCurrentView('winddown')}
                showToast={showToast}
              />
            )}

            {/* 4. Free-form Editor (optional) */}
            {currentView === 'editor' && (
              <JournalEditor
                userId={currentUser.uid}
                onSaveSuccess={(saved) => {
                  setEntries((prev) => {
                    const idx = prev.findIndex((e) => e.id === saved.id);
                    if (idx >= 0) {
                      const updated = [...prev];
                      updated[idx] = saved;
                      return updated;
                    }
                    return [saved, ...prev];
                  });
                }}
                onOpenConversation={handleOpenConversation}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      {currentUser && (
        <MobileBottomNav
          currentView={currentView}
          onViewChange={setCurrentView}
        />
      )}

      {/* Modal: Bedtime Reader Mode (large comfortable text for reading before sleep) */}
      {readerEntry && (
        <BedtimeReaderModal
          entry={readerEntry}
          onClose={() => setReaderEntry(null)}
        />
      )}

      {/* Modal: Entry Details & Multi-Turn Chat */}
      {selectedEntry && currentUser && (
        <EntryDetailModal
          userId={currentUser.uid}
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onEntryDeleted={handleEntryDeleted}
          showToast={showToast}
        />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
