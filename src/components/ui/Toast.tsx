import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ToastTone = 'info' | 'success' | 'error' | 'warn';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastCtx {
  push: (t: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warn: (title: string, description?: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export const useToast = (): ToastCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const toneStyles: Record<ToastTone, string> = {
  info:    'border-accent/30 bg-accent-soft',
  success: 'border-success/30 bg-success/10',
  error:   'border-danger/30 bg-danger/10',
  warn:    'border-warn/30 bg-warn/10',
};
const toneIcon: Record<ToastTone, string> = {
  info: '•',
  success: '✓',
  error: '✕',
  warn: '!',
};
const toneText: Record<ToastTone, string> = {
  info: 'text-accent',
  success: 'text-success',
  error: 'text-danger',
  warn: 'text-warn',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { ...t, id }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4500);
  }, []);

  const api: ToastCtx = useMemo(() => ({
    push,
    success: (title, description) => push({ tone: 'success', title, description }),
    error: (title, description) => push({ tone: 'error', title, description }),
    info: (title, description) => push({ tone: 'info', title, description }),
    warn: (title, description) => push({ tone: 'warn', title, description }),
  }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-[340px] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border ${toneStyles[t.tone]} backdrop-blur-md shadow-elevated px-4 py-3 animate-slide-in-right`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-5 w-5 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold ${toneText[t.tone]}`}>
                {toneIcon[t.tone]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-fg leading-tight">{t.title}</div>
                {t.description && <div className="text-xs text-fg-muted mt-1 leading-snug">{t.description}</div>}
              </div>
              <button
                onClick={() => setToasts((s) => s.filter((x) => x.id !== t.id))}
                className="text-fg-dim hover:text-fg text-sm leading-none"
              >✕</button>
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
};

// Bridge for non-component code
let externalPush: ((t: Omit<Toast, 'id'>) => void) | null = null;
export const ToastBridge: React.FC = () => {
  const { push } = useToast();
  useEffect(() => { externalPush = push; return () => { externalPush = null; }; }, [push]);
  return null;
};
export const toast = {
  success: (title: string, description?: string) => externalPush?.({ tone: 'success', title, description }),
  error:   (title: string, description?: string) => externalPush?.({ tone: 'error', title, description }),
  info:    (title: string, description?: string) => externalPush?.({ tone: 'info', title, description }),
  warn:    (title: string, description?: string) => externalPush?.({ tone: 'warn', title, description }),
};
