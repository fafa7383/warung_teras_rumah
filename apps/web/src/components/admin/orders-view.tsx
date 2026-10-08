'use client';

import {
  ADMIN_ORDER_TAB_KEYS,
  ADMIN_ORDER_TAB_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  formatRupiah,
  type AdminOrderListItemDto,
  type AdminOrderTab,
} from '@wtr/shared';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BowlArt, BowlLoader } from '@/components/brand/food-art';
import { SegmentedControl } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/empty-state';
import { Armchair, Bike } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Chip, StatusBadge } from '@/components/ui/status-badge';
import { useAdminOrders } from '@/lib/admin-api';
import { useAdminLocal } from '@/lib/admin-store';
import { cn } from '@/lib/cn';
import { useIsDesktop, useNow } from '@/lib/hooks';
import { spring } from '@/lib/motion';
import { countdown, relativeTime, todayKey } from '@/lib/time';
import { OnboardingChecklist } from './onboarding';
import { PrimaryActionButton } from './order-actions';
import { AdminOrderDetail } from './order-detail';
import { StoreClosureControl } from './store-closure';

const EMPTY_TEXT: Record<AdminOrderTab, string> = {
  NEEDS_ACTION: 'Belum ada pesanan yang perlu dicek.',
  ONGOING: 'Tidak ada pesanan yang sedang berjalan.',
  DONE: 'Belum ada pesanan selesai di tanggal ini.',
};

function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1 rounded-section p-3.5', highlight ? 'bg-tint text-white' : 'bg-surface shadow-card')}>
      <span className={cn('text-footnote', highlight ? 'text-white/85' : 'text-label-2')}>{label}</span>
      <span className="font-rounded text-title-3 font-bold tabular-nums">{value}</span>
    </div>
  );
}

function OrderCard({
  order,
  now,
  selected,
  onOpen,
}: {
  order: AdminOrderListItemDto;
  now: number;
  selected: boolean;
  onOpen: () => void;
}) {
  const isDesktop = useIsDesktop();
  const seen = useAdminLocal((state) => state.seenOrderIds.includes(order.id));
  const awaitingPayment = order.status === 'AWAITING_PAYMENT';
  const isNew = order.status === 'AWAITING_CONFIRMATION' && !seen;
  const remaining = order.paymentDeadline ? Date.parse(order.paymentDeadline) - now : 0;

  return (
    <article
      className={cn(
        'relative flex flex-col gap-2.5 rounded-section bg-surface p-4 shadow-card ring-2 transition-shadow',
        selected ? 'ring-tint' : 'ring-transparent',
        awaitingPayment && 'opacity-60',
      )}
    >
      {isDesktop ? (
        <button type="button" onClick={onOpen} className="absolute inset-0 rounded-section" aria-label={`Buka ${order.code}`} />
      ) : (
        <Link href={`/admin/pesanan/${order.id}`} className="absolute inset-0 rounded-section" aria-label={`Buka ${order.code}`} />
      )}
      <div className="pointer-events-none flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-rounded text-headline">
            {isNew && <span className="size-2.5 animate-pulse-dot rounded-full bg-tint" aria-label="Baru" />}
            {order.code}
          </p>
          <p className="text-footnote text-label-2">{relativeTime(order.createdAt, now)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="pointer-events-none flex flex-wrap gap-1.5">
        <Chip>
          {order.orderType === 'DINE_IN' ? <Armchair size={13} aria-hidden="true" /> : <Bike size={13} aria-hidden="true" />}
          {ORDER_TYPE_LABELS[order.orderType]}
        </Chip>
        <Chip className={order.paymentMethod === 'QRIS' ? 'bg-blue-soft text-blue-text' : 'bg-green-soft text-green-text'}>
          {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </Chip>
      </div>
      <div className="pointer-events-none">
        <p className="text-callout font-semibold">{order.customerName}</p>
        <p className="truncate text-subhead text-label-2">
          {order.itemCount} item · {order.itemSummary}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="pointer-events-none text-title-3 font-bold tabular-nums">{formatRupiah(order.total)}</span>
        {awaitingPayment ? (
          <span className="pointer-events-none text-footnote font-semibold text-orange-text">
            Pembeli belum bayar · sisa {countdown(remaining)}
          </span>
        ) : (
          <div className="relative z-10">
            <PrimaryActionButton order={order} place="card" onOpen={onOpen} />
          </div>
        )}
      </div>
    </article>
  );
}

/** Beranda admin: switch buka/tutup, ringkasan hari ini, tab pesanan (PRD 8.2). */
export function OrdersView() {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<AdminOrderTab>('NEEDS_ACTION');
  const [date, setDate] = useState(todayKey);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useNow(1000);
  const { data, isPending } = useAdminOrders(tab, tab === 'DONE' ? date : undefined);

  const open = (id: string) => (isDesktop ? setSelectedId(id) : router.push(`/admin/pesanan/${id}`));
  const summary = data?.summary;

  return (
    <div className="lg:flex lg:h-dvh">
      <div className="min-w-0 flex-1 lg:max-w-[480px] lg:overflow-y-auto lg:border-r lg:border-separator">
        <PageHeader title="Pesanan" />
        <div className="flex flex-col gap-5 px-4 pb-6">
          <StoreClosureControl />
          <div className="grid grid-cols-3 gap-2.5">
            <SummaryCard label="Pesanan hari ini" value={String(summary?.ordersToday ?? '–')} />
            <SummaryCard label="Omzet hari ini" value={summary ? formatRupiah(summary.revenueToday) : '–'} />
            <SummaryCard
              label="Perlu tindakan"
              value={String(summary?.needsAction ?? '–')}
              highlight={(summary?.needsAction ?? 0) > 0}
            />
          </div>
          <OnboardingChecklist />
          <SegmentedControl
            label="Tab pesanan"
            value={tab}
            onChange={setTab}
            options={ADMIN_ORDER_TAB_KEYS.map((key) => ({
              value: key,
              label:
                key === 'NEEDS_ACTION' && summary?.needsAction
                  ? `${ADMIN_ORDER_TAB_LABELS[key]} (${summary.needsAction})`
                  : ADMIN_ORDER_TAB_LABELS[key],
            }))}
          />
          {tab === 'DONE' && (
            <label className="flex items-center justify-between gap-3 rounded-section bg-surface px-4 py-2.5">
              <span className="text-body">Tanggal</span>
              <input
                type="date"
                value={date}
                max={todayKey()}
                onChange={(event) => setDate(event.target.value || todayKey())}
                className="rounded-control bg-fill px-3 py-1.5 text-body text-label outline-none"
              />
            </label>
          )}

          {isPending ? (
            <BowlLoader label="Memuat pesanan…" />
          ) : data && data.orders.length > 0 ? (
            <div className="flex flex-col gap-3">
              {/* Pesanan baru meluncur masuk, kartu yang pindah tab menyusut keluar. */}
              <AnimatePresence initial={false} mode="popLayout">
                {data.orders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: -24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 60, scale: 0.95 }}
                    transition={spring.smooth}
                  >
                    <OrderCard
                      order={order}
                      now={now}
                      selected={isDesktop && selectedId === order.id}
                      onOpen={() => open(order.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyState
              art={<BowlArt variant="bakso" size={88} spoon={false} className="opacity-60 grayscale" />}
              title="Masih sepi"
              message={EMPTY_TEXT[tab]}
            />
          )}
        </div>
      </div>

      {/* Desktop: daftar & detail berdampingan (PRD 4.4). */}
      <div className="hidden min-w-0 flex-1 overflow-y-auto px-6 pt-8 lg:block">
        {selectedId ? (
          <div className="mx-auto max-w-2xl">
            <AdminOrderDetail key={selectedId} orderId={selectedId} />
          </div>
        ) : (
          <EmptyState
            className="pt-32"
            art={<BowlArt variant="mie-ayam" size={96} spoon={false} className="opacity-60 grayscale" />}
            title="Pilih pesanan"
            message="Detail pesanan tampil di sini."
          />
        )}
      </div>
    </div>
  );
}
