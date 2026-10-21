import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, Sparkles, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ToastKind = 'success' | 'error' | 'info' | 'warning' | 'reward';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, 'id' | 'duration'> & { duration?: number }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  info: <Info className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  reward: <Sparkles className="h-5 w-5" />,
};

const STYLES: Record<ToastKind, { ring: string; icon: string }> = {
  success: { ring: 'ring-emerald-200 dark:ring-emerald-500/30', icon: 'text-emerald-600 dark:text-emerald-400' },
  error: { ring: 'ring-rose-200 dark:ring-rose-500/30', icon: 'text-rose-600 dark:text-rose-400' },
  info: { ring: 'ring-sky-200 dark:ring-sky-500/30', icon: 'text-sky-600 dark:text-sky-400' },
  warning: { ring: 'ring-amber-200 dark:ring-amber-500/30', icon: 'text-amber-600 dark:text-amber-400' },
  reward: { ring: 'ring-violet-200 dark:ring-violet-500/30', icon: 'text-violet-600 dark:text-violet-400' },
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    ({ duration = 4200, ...rest }) => {
      counter += 1;
      const id = `toast_${counter}`;
      setToasts((prev) => [...prev.slice(-3), { ...rest, id, duration }]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[1200] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end sm:p-6"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border border-ink-200 bg-white p-4 shadow-card-hover ring-1 dark:border-white/10 dark:bg-ink-900',
                STYLES[t.kind].ring,
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn('mt-0.5 shrink-0', STYLES[t.kind].icon)}>{ICONS[t.kind]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink-900 dark:text-white">{t.title}</p>
                  {t.description ? (
                    <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-300">{t.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 rounded-lg p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
