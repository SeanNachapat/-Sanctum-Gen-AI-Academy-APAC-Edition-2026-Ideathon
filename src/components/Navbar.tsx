import React from 'react';
import { 
  LogOut, 
  Moon, 
  Calendar as CalendarIcon, 
  BookOpen
} from 'lucide-react';
import type { UserProfile } from '../types';

export type NavView = 'winddown' | 'calendar' | 'history' | 'editor';

interface NavbarProps {
  user: UserProfile | null;
  currentView: NavView;
  onViewChange: (view: NavView) => void;
  onNewReflection: () => void;
  onOpenThreatModel?: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onViewChange,
  onNewReflection,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1F1F23] bg-[#0A0A0B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onViewChange('winddown')}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1C1C1E] via-[#2C2C2E] to-[#0A0A0B] p-0.5 shadow-lg shadow-[#5E5CE6]/15 border border-[#3A3A3C] group cursor-pointer"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#5E5CE6]/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-full w-full items-center justify-center rounded-[10px] bg-[#0E0E11]">
              <Moon className="h-4 w-4 text-[#5E5CE6] transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-serif italic font-medium tracking-wide text-white">Sanctum</h1>
              <span className="rounded bg-[#1C1C1E] border border-[#2C2C2E] px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#AEAEB2] font-mono">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="hidden text-[10px] uppercase tracking-[0.2em] text-[#636366] sm:block">
              Bedtime Sanctuary & Emotion Calendar
            </p>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* View Navigation (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center rounded-xl bg-[#141418] p-1 border border-[#22222A]">
              <button
                id="nav-tab-winddown"
                onClick={() => {
                  onViewChange('winddown');
                  onNewReflection();
                }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  currentView === 'winddown' || currentView === 'editor'
                    ? 'bg-[#5E5CE6] text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#D1D1D6] hover:bg-[#202028]'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Wind Down</span>
              </button>

              <button
                id="nav-tab-calendar"
                onClick={() => onViewChange('calendar')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  currentView === 'calendar'
                    ? 'bg-[#5E5CE6] text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#D1D1D6] hover:bg-[#202028]'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>Calendar</span>
              </button>

              <button
                id="nav-tab-history"
                onClick={() => onViewChange('history')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  currentView === 'history'
                    ? 'bg-[#5E5CE6] text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#D1D1D6] hover:bg-[#202028]'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Past Nights</span>
              </button>
            </div>

            {/* User Profile Card */}
            <div className="flex items-center gap-3 border-l border-[#1F1F23] pl-3 sm:pl-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-8 w-8 rounded-full border border-[#2C2C2E] object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#3A3A3C] to-[#636366] text-[10px] font-bold text-white border border-[#2C2C2E]">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}

              <div className="hidden md:block text-left">
                <p className="text-xs font-medium text-white leading-tight truncate max-w-[120px]">
                  {user.displayName || 'Journaler'}
                </p>
                <p className="text-[10px] text-[#636366] uppercase tracking-tighter leading-tight truncate max-w-[120px]">
                  {user.email || 'Pro Member'}
                </p>
              </div>

              {/* Sign Out */}
              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign Out"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2C2C2E] bg-[#1C1C1E] text-[#8E8E93] hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </header>
  );
};
