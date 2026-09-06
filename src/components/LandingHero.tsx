import React, { useState } from 'react';
import { 
  Moon, 
  Sparkles, 
  Calendar as CalendarIcon, 
  BookOpen, 
  ArrowRight,
  BrainCircuit,
  AlertCircle
} from 'lucide-react';

interface LandingHeroProps {
  onSignIn: () => Promise<void>;
  onOpenThreatModel?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthClick = async () => {
    try {
      setLoading(true);
      setError(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Accent Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[420px] w-[640px] rounded-full bg-[#5E5CE6]/10 blur-[130px]" />
        <div className="h-[300px] w-[400px] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Top Badges */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#2C2C2E] bg-[#1C1C1E] px-3.5 py-1.5 text-xs text-[#D1D1D6] backdrop-blur-md mb-8">
          <Moon className="h-3.5 w-3.5 text-[#5E5CE6]" />
          <span className="text-[11px] uppercase tracking-wider text-[#AEAEB2]">Mindful Evening Wind-Down & Reflection</span>
          <span className="h-1 w-1 rounded-full bg-[#636366]" />
          <span className="text-[#5E5CE6] font-medium text-[11px]">Gemini 3.6 Flash</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-[#F2F2F7] sm:text-6xl font-serif italic">
          Your Bedtime Sanctuary,{' '}
          <span className="bg-gradient-to-r from-[#5E5CE6] via-[#AEAEB2] to-white bg-clip-text text-transparent not-italic font-sans font-bold">
            Reflected by Night
          </span>
        </h1>

        <p className="mt-6 text-base leading-relaxed text-[#8E8E93] sm:text-lg max-w-2xl mx-auto font-light">
          Unburden your mind in gentle stages before sleep. Weave your thoughts into topic-separated journals, track daily emotion colors, and rest with clarity.
        </p>

        {/* Error Alert if any */}
        {error && (
          <div className="mt-6 max-w-md mx-auto flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-xs text-left">{error}</p>
          </div>
        )}

        {/* Google Sign-In Action */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="google-sign-in-btn"
            onClick={handleAuthClick}
            disabled={loading}
            className="flex h-12 w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-white px-8 text-xs uppercase tracking-wider font-semibold text-[#0A0A0B] shadow-xl shadow-[#5E5CE6]/10 transition-all hover:bg-[#F2F2F7] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
            <ArrowRight className="h-4 w-4 text-neutral-600" />
          </button>
        </div>

        <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#636366]">
          Sign in effortlessly with your Google account.
        </p>

        {/* 4-Pillar Architectural Breakdown */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
          
          <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-5 backdrop-blur-sm hover:border-[#5E5CE6]/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5E5CE6]/10 text-[#5E5CE6] mb-3 border border-[#5E5CE6]/20">
              <Moon className="h-4 w-4" />
            </div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">1. Bedtime Stages</h3>
            <p className="mt-1.5 text-xs text-[#8E8E93] leading-relaxed">
              Step-by-step evening reflection flow designed to quiet your mind before sleep.
            </p>
          </div>

          <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-5 backdrop-blur-sm hover:border-[#30D158]/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#30D158]/10 text-[#30D158] mb-3 border border-[#30D158]/20">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">2. Daily Emotion Colors</h3>
            <p className="mt-1.5 text-xs text-[#8E8E93] leading-relaxed">
              Track your feelings each night with an evening spectrum of luminous colors.
            </p>
          </div>

          <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-5 backdrop-blur-sm hover:border-[#5E5CE6]/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5E5CE6]/10 text-[#5E5CE6] mb-3 border border-[#5E5CE6]/20">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">3. Topic Separation</h3>
            <p className="mt-1.5 text-xs text-[#8E8E93] leading-relaxed">
              Gemini synthesizes your day into clear, peaceful themes and personalized bedtime affirmations.
            </p>
          </div>

          <div className="rounded-xl border border-[#2C2C2E] bg-[#1C1C1E]/60 p-5 backdrop-blur-sm hover:border-purple-500/40 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 mb-3 border border-purple-500/20">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-white">4. Bedtime Reader</h3>
            <p className="mt-1.5 text-xs text-[#8E8E93] leading-relaxed">
              A dimmed, high-contrast reader mode designed for comfortable reading in a dark room.
            </p>
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="mx-auto mt-12 w-full max-w-4xl border-t border-[#1F1F23] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-[#636366]">
        <div className="flex items-center gap-2">
          <Moon className="h-3.5 w-3.5 text-[#5E5CE6]" />
          <span>Sanctum • Bedtime Wind-Down & Evening Reflections</span>
        </div>
        <p>© Sanctum. Rest well and awaken with clarity.</p>
      </div>
    </div>
  );
};
