import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md animate-slideIn ${
            t.type === 'success'
              ? 'border-[#30D158]/40 bg-[#1C1C1E]/95 text-[#30D158]'
              : t.type === 'error'
              ? 'border-red-500/40 bg-[#1C1C1E]/95 text-red-400'
              : 'border-[#5E5CE6]/40 bg-[#1C1C1E]/95 text-[#5E5CE6]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#30D158]" />}
            {t.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
            {t.type === 'info' && <Info className="h-4 w-4 shrink-0 text-[#5E5CE6]" />}
            <span className="text-xs font-medium text-[#F2F2F7]">{t.message}</span>
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="text-[#8E8E93] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
