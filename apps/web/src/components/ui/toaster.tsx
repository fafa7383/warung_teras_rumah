'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/lib/toast-store';
import { CircleAlert, CircleCheck, Info } from './icons';

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const ICON_COLORS = { success: 'text-green', error: 'text-red', info: 'text-blue' };

/**
 * Toast kapsul gelap, 3 detik (PRD 3.6). Posisi diatur tiap layout lewat className
 * agar selalu di atas tab bar / tombol yang menempel di bawah.
 */
export function Toaster({ className = 'bottom-[calc(env(safe-area-inset-bottom)+24px)]' }: { className?: string }) {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      className={cn('pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center px-4', className)}
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full bg-[rgb(29_29_31/0.92)] py-2.5 pr-2.5 pl-4 text-white shadow-float backdrop-blur-xl"
            >
              <Icon size={20} className={cn('shrink-0', ICON_COLORS[toast.tone])} aria-hidden="true" />
              <span className={cn('text-subhead font-medium', !toast.action && 'pr-2')}>{toast.message}</span>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="tap shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-footnote font-semibold"
                >
                  {toast.action.label}
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
