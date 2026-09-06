import React from 'react';
import { 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  Plus, 
  BookOpen, 
  History, 
  Cpu
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  currentView: 'editor' | 'history';
  onViewChange: (view: 'editor' | 'history') => void;
  onNewReflection: () => void;
  onOpenThreatModel: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentView,
  onViewChange,
  onNewReflection,
  onOpenThreatModel,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1F1F23] bg-[#0A0A0B]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1C1C1E] via-[#2C2C2E] to-[#0A0A0B] p-0.5 shadow-lg shadow-[#5E5CE6]/15 border border-[#3A3A3C] group cursor-pointer">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-[#5E5CE6]/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex h-full w-full items-center justify-center rounded-[10px] bg-[#0E0E11]">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-[#5E5CE6] transition-transform duration-300 group-hover:scale-110"
              >
                <path 
                  d="M12 2L3 7V17L12 22L21 17V7L12 2Z" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="opacity-70"
                />
                <path 
                  d="M12 6L7 9V15L12 18L17 15V9L12 6Z" 
                  fill="currentColor" 
                  fillOpacity="0.15" 
                  stroke="currentColor" 
                  strokeWidth="1.2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <circle cx="12" cy="12" r="2" fill="#30D158" className="animate-pulse" />
              </svg>
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
              Cognitive Sanctuary & Reflection Vault
            </p>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        {user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* View Navigation */}
            <div className="flex items-center rounded-lg bg-[#1C1C1E] p-1 border border-[#2C2C2E]">
              <button
                id="nav-tab-editor"
                onClick={() => {
                  onViewChange('editor');
                  onNewReflection();
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  currentView === 'editor'
                    ? 'bg-[#5E5CE6] text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#D1D1D6] hover:bg-[#2C2C2E]/60'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Write</span>
              </button>

              <button
                id="nav-tab-history"
                onClick={() => onViewChange('history')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  currentView === 'history'
                    ? 'bg-[#5E5CE6] text-white shadow-sm'
                    : 'text-[#8E8E93] hover:text-[#D1D1D6] hover:bg-[#2C2C2E]/60'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>History</span>
              </button>
            </div>

            {/* Security & Threat Model Info */}
            <button
              id="threat-model-btn"
              onClick={onOpenThreatModel}
              title="View Security & Agentic Threat Model"
              className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#2C2C2E] bg-[#1C1C1E]/70 px-2.5 py-1.5 text-xs font-medium text-[#D1D1D6] hover:bg-[#2C2C2E] hover:text-white transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 bg-[#30D158] rounded-full"></span>
              <span className="text-[11px] text-[#30D158] font-medium">Firestore Synced</span>
            </button>

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
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenThreatModel}
              className="flex items-center gap-1 text-xs text-[#8E8E93] hover:text-[#D1D1D6] cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#30D158]" />
              <span className="text-[11px]">OWASP & Security Specs</span>
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
