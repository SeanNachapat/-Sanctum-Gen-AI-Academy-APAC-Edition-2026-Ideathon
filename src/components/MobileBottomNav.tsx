import React from 'react';
import { Moon, Calendar as CalendarIcon, BookOpen } from 'lucide-react';

export type AppView = 'winddown' | 'calendar' | 'history' | 'editor';

interface MobileBottomNavProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onOpenThreatModel?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0C0C10]/95 backdrop-blur-lg border-t border-[#1C1C24] px-4 py-2 sm:hidden shadow-2xl">
      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {/* Tab 1: Bedtime Wind Down */}
        <button
          type="button"
          onClick={() => onViewChange('winddown')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentView === 'winddown'
              ? 'text-[#5E5CE6]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentView === 'winddown' ? 'bg-[#5E5CE6]/15' : ''}`}>
            <Moon className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Wind Down</span>
        </button>

        {/* Tab 2: Emotion Calendar */}
        <button
          type="button"
          onClick={() => onViewChange('calendar')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentView === 'calendar'
              ? 'text-[#5E5CE6]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentView === 'calendar' ? 'bg-[#5E5CE6]/15' : ''}`}>
            <CalendarIcon className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Calendar</span>
        </button>

        {/* Tab 3: Past Nights / History */}
        <button
          type="button"
          onClick={() => onViewChange('history')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            currentView === 'history'
              ? 'text-[#5E5CE6]'
              : 'text-[#8E8E93] hover:text-[#D1D1D6]'
          }`}
        >
          <div className={`p-1 rounded-lg ${currentView === 'history' ? 'bg-[#5E5CE6]/15' : ''}`}>
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-medium mt-0.5">Nights</span>
        </button>
      </div>
    </nav>
  );
};
