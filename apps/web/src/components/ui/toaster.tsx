'use client';

import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/lib/toast-store';
import { CircleAlert, CircleCheck, Info } from './icons';

const ICONS = { success: CircleCheck, error: CircleAlert, info: Info };
const ICON_COLORS = { success: 'text-green', error: 'text-red', info: 'text-blue' };

/**
 * Toast kapsul gelap, 3 detik (PRD 3.6), muncul dengan pegas dan bisa digeser untuk ditutup.
 * Posisi diatur tiap layout lewat className agar selalu di atas tab bar / tombol bawah.
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
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.9, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: 12, scale: 0.94, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.y) > 30) dismiss(toast.id);
              }}
              className="pointer-events-auto flex max-w-md touch-none items-center gap-2.5 rounded-full bg-[rgb(29_29_31/0.92)] py-2.5 pr-2.5 pl-4 text-white shadow-float backdrop-blur-xl"
            >
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.08 }}
                className="flex shrink-0"
              >
                <Icon size={20} className={ICON_COLORS[toast.tone]} aria-hidden="true" />
              </motion.span>
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
