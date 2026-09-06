import React, { useState, useEffect } from 'react';
import { subscribeAuthState, signInWithGoogle, logOut, type User } from './lib/firebase';
import { subscribeUserEntries } from './lib/firestoreService';
import type { UserProfile, JournalEntry } from './types';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { JournalEditor } from './components/JournalEditor';
import { EntryHistory } from './components/EntryHistory';
import { EntryDetailModal } from './components/EntryDetailModal';
import { ThreatModelModal } from './components/ThreatModelModal';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'editor' | 'history'>('editor');
  
  // Entries state
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Modals & UI state
  const [showThreatModel, setShowThreatModel] = useState(false);
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
      // If user closed popup, handle cleanly
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
      setCurrentView('editor');
    } catch (err: any) {
      console.error('Sign out error:', err);
      showToast('Failed to sign out', 'error');
    }
  };

  const handleOpenConversation = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  const handleEntryDeleted = (deletedId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    if (selectedEntry?.id === deletedId) {
      setSelectedEntry(null);
    }
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
      {/* Sophisticated Dot Matrix Texture */}
      <div className="absolute inset-0 bg-sophisticated-dots opacity-[0.07] pointer-events-none -z-0" />
      
      {/* Navigation Bar */}
      <div className="relative z-40">
        <Navbar
          user={currentUser}
          currentView={currentView}
          onViewChange={setCurrentView}
          onNewReflection={() => {
            setSelectedEntry(null);
            setCurrentView('editor');
          }}
          onOpenThreatModel={() => setShowThreatModel(true)}
          onSignOut={handleSignOut}
        />
      </div>

      {/* Main Viewport */}
      <main className="flex-1 relative z-10">
        {!currentUser ? (
          <LandingHero
            onSignIn={handleSignIn}
            onOpenThreatModel={() => setShowThreatModel(true)}
          />
        ) : (
          <div>
            {currentView === 'editor' && (
              <JournalEditor
                userId={currentUser.uid}
                onSaveSuccess={(saved) => {
                  // Keep list up to date
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

            {currentView === 'history' && (
              <EntryHistory
                userId={currentUser.uid}
                entries={entries}
                onSelectEntry={(entry) => setSelectedEntry(entry)}
                onNewReflection={() => setCurrentView('editor')}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </main>

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

      {/* Modal: Threat Model & OWASP Security Architecture */}
      {showThreatModel && (
        <ThreatModelModal onClose={() => setShowThreatModel(false)} />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
