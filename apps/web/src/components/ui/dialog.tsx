'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks';
import { Button } from './button';
import { useOverlay } from './sheet';

export interface DialogAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  loading?: boolean;
}

/** Alert iOS untuk konfirmasi (hapus, tolak, ubah status). */
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message?: ReactNode;
  actions: DialogAction[];
  children?: ReactNode;
}) {
  const hydrated = useHydrated();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div
            className="absolute inset-0 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="glass-strong relative w-full max-w-[320px] rounded-[28px] p-5 text-center outline-none"
          >
            <h2 className="text-headline">{title}</h2>
            {message && <div className="mt-1.5 text-footnote text-label-2">{message}</div>}
            {children}
            <div className={cn('mt-5 flex gap-2', actions.length > 2 && 'flex-col')}>
              {actions.map((action) => (
                <Button
                  key={action.label}
                  size="md"
                  fullWidth
                  loading={action.loading}
                  onClick={action.onPress}
                  variant={
                    action.style === 'destructive'
                      ? 'destructive'
                      : action.style === 'primary'
                        ? 'filled'
                        : action.style === 'cancel'
                          ? 'gray'
                          : 'tinted'
                  }
                  className={cn('flex-1', action.style === 'cancel' && 'text-label')}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
