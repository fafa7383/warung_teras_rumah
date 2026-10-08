'use client';

import { AnimatePresence, motion, useDragControls, type DragControls } from 'motion/react';
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { useHydrated, useIsDesktop, usePrefersReducedMotion } from '@/lib/hooks';
import { useUiStore } from '@/lib/ui-store';
import { IconButton } from './button';
import { X } from './icons';

/** Kunci scroll halaman, tutup dengan Escape, dan sembunyikan tab bar selama overlay terbuka. */
export function useOverlay(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const { pushOverlay, popOverlay } = useUiStore.getState();
    pushOverlay();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      popOverlay();
      root.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);
}

const SheetDragContext = createContext<DragControls | null>(null);

interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** Label untuk screen reader bila tidak memakai SheetHeader. */
  label: string;
  children: ReactNode;
  /** large = tinggi awal 90% layar (Detail Menu, PRD 6.3). */
  size?: 'auto' | 'large';
  desktopWidth?: number;
}

/** Bottom sheet iOS di HP (tarik ke bawah untuk menutup), modal tengah di desktop. */
export function Sheet({ open, onClose, label, children, size = 'auto', desktopWidth = 560 }: SheetProps) {
  const hydrated = useHydrated();
  const isDesktop = useIsDesktop();
  const reduceMotion = usePrefersReducedMotion();
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!hydrated) return null;

  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : isDesktop
      ? { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96 } }
      : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            {...motionProps}
            transition={reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 380, damping: 36, mass: 0.9 }}
            drag={isDesktop || reduceMotion ? false : 'y'}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            style={isDesktop ? { maxWidth: desktopWidth } : undefined}
            className={cn(
              'relative flex w-full flex-col overflow-hidden bg-surface shadow-float outline-none',
              isDesktop ? 'max-h-[88vh] rounded-card' : 'max-h-[94dvh] rounded-t-sheet',
              size === 'large' && !isDesktop && 'h-[92dvh]',
            )}
          >
            <SheetDragContext.Provider value={dragControls}>
              {!isDesktop && <SheetGrabber />}
              {children}
            </SheetDragContext.Provider>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function useStartDrag() {
  const controls = useContext(SheetDragContext);
  return (event: PointerEvent) => controls?.start(event);
}

function SheetGrabber() {
  const startDrag = useStartDrag();
  return (
    <div
      onPointerDown={startDrag}
      className="absolute inset-x-0 top-0 z-20 flex h-5 cursor-grab touch-none items-center justify-center"
      aria-hidden="true"
    >
      <span className="h-[5px] w-9 rounded-full bg-black/20" />
    </div>
  );
}

/** Judul sheet + tombol tutup; area ini juga bisa ditarik untuk menutup. */
export function SheetHeader({ title, onClose, trailing }: { title: ReactNode; onClose?: () => void; trailing?: ReactNode }) {
  const startDrag = useStartDrag();
  const id = useId();
  return (
    <div onPointerDown={startDrag} className="flex shrink-0 touch-none items-center gap-3 px-4 pt-6 pb-2">
      <h2 id={id} className="flex-1 text-title-3 font-bold">
        {title}
      </h2>
      {trailing}
      {onClose && (
        <IconButton label="Tutup" variant="fill" onClick={onClose} className="size-8">
          <X size={18} strokeWidth={2.6} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
}

export function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', className)}>{children}</div>;
}

/** Area tombol yang menempel di bawah sheet (mis. "Tambah ke Keranjang"). */
export function SheetFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('hairline-t shrink-0 bg-surface/95 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]', className)}>
      {children}
    </div>
  );
}
