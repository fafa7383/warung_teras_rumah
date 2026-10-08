'use client';

import {
  FINAL_ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  formatOptionSummary,
  formatRupiah,
  formatTimeWIB,
  getStatusFlow,
  type OrderItemDto,
  type OrderStatus,
  type OrderStatusLogDto,
  type OrderType,
  type PaymentMethod,
} from '@wtr/shared';
import { motion } from 'motion/react';
import { Check } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';

/**
 * Stepper vertikal sesuai alur (PRD Bagian 7). Langkah selesai bertanda centang + jam.
 * Bila berakhir Ditolak/Kedaluwarsa/Dibatalkan, langkah terakhir diganti status tersebut.
 */
export function StatusTimeline({
  status,
  orderType,
  paymentMethod,
  logs,
}: {
  status: OrderStatus;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  logs: OrderStatusLogDto[];
}) {
  const flow = getStatusFlow({ orderType, paymentMethod });
  const timeOf = new Map(logs.map((log) => [log.status, log.at]));
  const failed = FINAL_ORDER_STATUSES.includes(status) && !flow.includes(status);
  const reachedIndex = failed ? Math.max(...logs.map((log) => flow.indexOf(log.status))) : flow.indexOf(status);
  const steps: { status: OrderStatus; state: 'done' | 'current' | 'upcoming' | 'failed' }[] = failed
    ? [
        ...flow.slice(0, reachedIndex + 1).map((s) => ({ status: s, state: 'done' as const })),
        { status, state: 'failed' as const },
      ]
    : flow.map((s, index) => ({
        status: s,
        state: index < reachedIndex ? 'done' : index === reachedIndex ? (FINAL_ORDER_STATUSES.includes(s) ? 'done' : 'current') : 'upcoming',
      }));

  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const time = timeOf.get(step.status);
        const last = index === steps.length - 1;
        return (
          <motion.li
            key={step.status}
            className="relative flex gap-3 pb-5 last:pb-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring.gentle, delay: 0.1 + index * 0.08 }}
          >
            {!last && (
              <span
                className="absolute top-7 left-[13px] h-[calc(100%-24px)] w-0.5 overflow-hidden rounded-full bg-fill-2"
                aria-hidden="true"
              >
                {/* Garis hijau terisi dari atas ke bawah, berurutan per langkah. */}
                <motion.span
                  className="block size-full origin-top rounded-full bg-green"
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: step.state === 'done' ? 1 : 0 }}
                  transition={{ duration: 0.55, ease: 'easeInOut', delay: 0.25 + index * 0.18 }}
                />
              </span>
            )}
            <motion.span
              key={step.state}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ ...spring.bouncy, delay: 0.15 + index * 0.18 }}
              className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full',
                step.state === 'done' && 'bg-green text-white',
                step.state === 'current' && 'bg-orange text-white ring-4 ring-orange/20',
                step.state === 'upcoming' && 'bg-fill-2 text-label-3',
                step.state === 'failed' && 'bg-red text-white',
              )}
              aria-hidden="true"
            >
              {step.state === 'done' ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <span className={cn('size-2 rounded-full bg-current', step.state === 'current' && 'animate-pulse-dot bg-white')} />
              )}
            </motion.span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2 pt-0.5">
              <span className={cn('text-subhead', step.state === 'upcoming' ? 'text-label-2' : 'font-semibold text-label')}>
                {ORDER_STATUS_LABELS[step.status]}
              </span>
              {time && step.state !== 'upcoming' && (
                <span className="text-footnote text-label-2 tabular-nums">{formatTimeWIB(time)}</span>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/** Daftar item pesanan: "2×" tebal di kiri, opsi di bawah nama, total baris di kanan. */
export function OrderItemsList({ items, large }: { items: OrderItemDto[]; large?: boolean }) {
  return (
    <ul className="list-separators">
      {items.map((item) => {
        const summary = formatOptionSummary(item.options);
        return (
          <li key={item.id} className="flex gap-3 px-4 py-3">
            <span className={cn('min-w-7 font-bold text-tint tabular-nums', large ? 'text-headline' : 'text-subhead')}>
              {item.quantity}×
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('font-semibold', large ? 'text-headline' : 'text-subhead')}>{item.name}</p>
              {summary && <p className={cn('text-label-2', large ? 'text-subhead' : 'text-footnote')}>{summary}</p>}
            </div>
            <span className={cn('shrink-0 tabular-nums', large ? 'text-headline' : 'text-subhead')}>
              {formatRupiah(item.lineTotal)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function TotalsRows({ subtotal, deliveryFee, total }: { subtotal: number; deliveryFee: number; total: number }) {
  return (
    <>
      <div className="flex min-h-11 items-center justify-between px-4 py-2.5 text-body">
        <span className="text-label-2">Subtotal</span>
        <span className="tabular-nums">{formatRupiah(subtotal)}</span>
      </div>
      <div className="flex min-h-11 items-center justify-between px-4 py-2.5 text-body">
        <span className="text-label-2">Ongkir</span>
        <span className="font-semibold text-green-text">{deliveryFee === 0 ? 'Gratis' : formatRupiah(deliveryFee)}</span>
      </div>
      <div className="flex min-h-11 items-center justify-between px-4 py-3">
        <span className="text-headline">Total</span>
        <span className="text-title-3 font-bold tabular-nums">{formatRupiah(total)}</span>
      </div>
    </>
  );
}
