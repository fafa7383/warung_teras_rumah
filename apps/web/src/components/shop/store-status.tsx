'use client';

import type { StoreStatus } from '@wtr/shared';
import { Clock } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

/** "● Buka · tutup pukul 21.00" / "● Tutup · buka lagi besok 10.00" (PRD 6.1). */
export function StoreStatusPill({ status, className }: { status: StoreStatus; className?: string }) {
  const text = status.isOpen
    ? `Buka · tutup pukul ${status.closesAt ?? ''}`
    : status.nextOpenLabel
      ? `Tutup · buka lagi ${status.nextOpenLabel}`
      : status.reason === 'MANUAL'
        ? 'Tutup sementara'
        : 'Tutup';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-footnote font-semibold',
        status.isOpen ? 'bg-green-soft text-green-text' : 'bg-red-soft text-red-text',
        className,
      )}
    >
      <span
        className={cn('size-2 rounded-full', status.isOpen ? 'animate-pulse-dot bg-green' : 'bg-red')}
        aria-hidden="true"
      />
      {text}
    </span>
  );
}

/** Kartu peringatan saat warung tutup; menu tetap bisa dilihat. */
export function StoreClosedNotice({ status, context = 'home' }: { status: StoreStatus; context?: 'home' | 'cart' }) {
  if (status.isOpen) return null;
  const reopen = status.nextOpenLabel ? ` Buka lagi ${status.nextOpenLabel}.` : '';
  return (
    <div className="flex gap-3 rounded-card bg-surface p-4 shadow-card">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-soft text-orange-text">
        <Clock size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-headline">Warung lagi tutup, Kak</p>
        <p className="mt-0.5 text-subhead text-label-2">
          {status.message ? `${status.message}.` : ''}
          {reopen}{' '}
          {context === 'home'
            ? 'Menu tetap bisa dilihat ya.'
            : 'Isi keranjang tetap tersimpan, pesan lagi saat warung buka ya.'}
        </p>
      </div>
    </div>
  );
}
