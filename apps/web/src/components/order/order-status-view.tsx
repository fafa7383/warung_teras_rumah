'use client';

import {
  CUSTOMER_CANCELLABLE_STATUSES,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  buildOrderMessageForStore,
  buildWhatsAppUrl,
  formatDateTimeWIB,
  formatPhoneDisplay,
  isFinalStatus,
  type OrderStatus,
  type PublicOrderDto,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BowlArt } from '@/components/brand/food-art';
import { WarungLoader } from '@/components/brand/warung-loader';
import { ConfettiBurst } from '@/components/motion/celebration';
import { Button, ButtonLink } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Armchair, Bike, Copy, MessageCircle, Receipt, RotateCcw } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { BackButton } from '@/components/ui/page-header';
import { Chip, STATUS_STYLES, StatusBadge } from '@/components/ui/status-badge';
import { ApiError, apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { copyText, vibrate } from '@/lib/device';
import { useHistoryStore } from '@/lib/local-stores';
import { riseOrder, spring } from '@/lib/motion';
import { reorderItems } from '@/lib/orders-client';
import { queryKeys, useOrderQuery } from '@/lib/queries';
import { toast } from '@/lib/toast-store';
import { OrderItemsList, StatusTimeline, TotalsRows } from './order-parts';
import { QrisPayment } from './qris-payment';
import { RECEIPT_STATUSES, statusCopy } from './status-copy';

function OrderTopBar({ title }: { title: string }) {
  return (
    <div className="glass hairline-b sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex h-bar max-w-2xl items-center gap-2 px-4">
        <BackButton fallbackHref="/" label="Kembali ke Home" />
        <p className="flex-1 truncate text-center text-headline">{title}</p>
        <span className="size-11" aria-hidden="true" />
      </div>
    </div>
  );
}

const CELEBRATE_STATUSES: readonly OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'COMPLETED'];

function StatusHero({ order, celebrate }: { order: PublicOrderDto; celebrate: boolean }) {
  const { icon: Icon, accent } = STATUS_STYLES[order.status];
  const copy = statusCopy(order);
  const active = !isFinalStatus(order.status);
  return (
    <section
      className="animate-rise flex flex-col items-center rounded-card bg-surface px-5 py-7 text-center shadow-card"
      style={riseOrder(1)}
      aria-live="polite"
    >
      <span className="relative flex size-20 items-center justify-center">
        {/* Gelombang lembut selama pesanan masih berjalan. */}
        {active && (
          <motion.span
            key={`wave-${order.status}`}
            className={cn('absolute inset-0 rounded-full', accent)}
            animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {celebrate && <ConfettiBurst key={`confetti-${order.status}`} count={32} />}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={order.status}
            className={cn('relative flex size-20 items-center justify-center rounded-full text-white', accent)}
            initial={{ scale: 0.3, rotate: -120, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.3, rotate: 120, opacity: 0 }}
            transition={spring.bouncy}
          >
            <Icon size={38} strokeWidth={2} aria-hidden="true" />
          </motion.span>
        </AnimatePresence>
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={order.status}
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={spring.gentle}
        >
          <StatusBadge status={order.status} className="mt-4" />
          <h2 className="mt-3 text-title-2 font-bold">{copy.title}</h2>
          <p className="mt-1 max-w-sm text-subhead text-label-2">{copy.message}</p>
        </motion.div>
      </AnimatePresence>
      {order.status === 'REJECTED' && order.store.whatsapp && (
        <ButtonLink
          href={buildWhatsAppUrl(order.store.whatsapp, `Halo, saya mau tanya tentang pesanan ${order.code}.`)}
          target="_blank"
          rel="noopener noreferrer"
          variant="tinted"
          size="md"
          className="mt-4"
          icon={<MessageCircle size={18} aria-hidden="true" />}
        >
          Hubungi Warung
        </ButtonLink>
      )}
    </section>
  );
}

export function OrderStatusView({ token }: { token: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: order, error, isPending, refetch } = useOrderQuery(token);
  const addHistory = useHistoryStore((state) => state.add);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const lastStatus = useRef<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  // Toast + getar singkat saat status berubah (PRD 6.5); confetti saat dikonfirmasi/selesai.
  useEffect(() => {
    if (!order) return;
    if (lastStatus.current && lastStatus.current !== order.status) {
      toast.info('Status pesananmu berubah');
      vibrate([30, 60, 30]);
      setCelebrate(CELEBRATE_STATUSES.includes(order.status));
    }
    lastStatus.current = order.status;
  }, [order]);

  // Link pesanan yang dibuka di HP ini ikut masuk riwayat lokal.
  useEffect(() => {
    if (order) addHistory({ token: order.token, code: order.code, createdAt: order.createdAt });
  }, [order?.token, order?.code, order?.createdAt, addHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isPending) {
    return (
      <>
        <OrderTopBar title="Pesanan" />
        <WarungLoader topic="pesanan" fill />
      </>
    );
  }

  if (!order) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <>
        <OrderTopBar title="Pesanan" />
        <EmptyState
          art={<BowlArt variant="bakso" size={96} spoon={false} className="opacity-60 grayscale" />}
          title={notFound ? 'Pesanan tidak ditemukan' : 'Ada kendala, coba lagi ya'}
          message={notFound ? 'Cek lagi link pesananmu, atau cari pakai kode pesanan.' : 'Status pesanan belum bisa dimuat.'}
          action={
            notFound ? (
              <ButtonLink href="/cek-pesanan" fullWidth>
                Cek Pakai Kode Pesanan
              </ButtonLink>
            ) : (
              <Button fullWidth onClick={() => refetch()}>
                Coba Lagi
              </Button>
            )
          }
        />
      </>
    );
  }

  const orderLink = typeof window === 'undefined' ? '' : `${window.location.origin}/pesanan/${order.token}`;
  const canCancel = CUSTOMER_CANCELLABLE_STATUSES.includes(order.status);
  const final = isFinalStatus(order.status);
  const showReceipt = RECEIPT_STATUSES.includes(order.status);

  const cancel = async () => {
    setCancelling(true);
    try {
      const updated = await apiFetch<PublicOrderDto>(`/api/orders/${encodeURIComponent(order.token)}/cancel`, {
        method: 'POST',
      });
      queryClient.setQueryData(queryKeys.order(order.token), updated);
      lastStatus.current = updated.status;
      toast.success('Pesanan dibatalkan');
    } catch (cancelError) {
      toast.error(cancelError instanceof ApiError ? cancelError.message : 'Ada kendala, coba lagi ya');
      await refetch();
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const reorder = async () => {
    setReordering(true);
    try {
      const { added, unavailable } = await reorderItems(queryClient, order.items);
      if (added === 0) {
        toast.error('Yah, menu di pesanan ini lagi habis semua');
        return;
      }
      if (unavailable > 0) toast.info(`${unavailable} menu lagi habis, sisanya sudah masuk keranjang`);
      else toast.success('Menu yang sama sudah masuk keranjang');
      router.push('/keranjang');
    } catch {
      toast.error('Ada kendala, coba lagi ya');
    } finally {
      setReordering(false);
    }
  };

  const whatsappText = buildOrderMessageForStore({ ...order, link: orderLink });

  return (
    <>
      <OrderTopBar title={`Pesanan ${order.code}`} />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <header className="animate-rise flex flex-col gap-2 px-1" style={riseOrder(0)}>
          <div className="flex items-center gap-2">
            <h1 className="font-rounded text-title-1 font-bold">{order.code}</h1>
            <button
              type="button"
              aria-label="Salin kode pesanan"
              onClick={async () => {
                if (await copyText(order.code)) toast.success('Kode pesanan disalin');
              }}
              className="tap flex size-9 items-center justify-center rounded-full bg-fill text-tint"
            >
              <Copy size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-subhead text-label-2">{formatDateTimeWIB(order.createdAt)}</span>
            <Chip>
              {order.orderType === 'DINE_IN' ? <Armchair size={14} aria-hidden="true" /> : <Bike size={14} aria-hidden="true" />}
              {ORDER_TYPE_LABELS[order.orderType]}
            </Chip>
            <Chip>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Chip>
          </div>
        </header>

        <StatusHero order={order} celebrate={celebrate} />

        {order.status === 'AWAITING_PAYMENT' && order.paymentMethod === 'QRIS' && <QrisPayment order={order} />}

        <ListSection header="Progres" className="animate-rise" style={riseOrder(2)}>
          <div className="px-4 py-4">
            <StatusTimeline
              status={order.status}
              orderType={order.orderType}
              paymentMethod={order.paymentMethod}
              logs={order.statusLogs}
            />
          </div>
        </ListSection>

        <ListSection header="Pemesan" className="animate-rise" style={riseOrder(3)}>
          <ListRow title="Nama" value={order.customerName} />
          <ListRow title="WhatsApp" value={formatPhoneDisplay(order.customerPhone)} />
          {order.orderType === 'DELIVERY' && (
            <ListRow title="Alamat" subtitle={`${order.address ?? ''}${order.landmark ? ` · Patokan: ${order.landmark}` : ''}`} />
          )}
        </ListSection>

        <ListSection header="Detail Pesanan" className="animate-rise" style={riseOrder(4)}>
          <OrderItemsList items={order.items} />
          <TotalsRows subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} />
          <ListRow title="Pembayaran" value={PAYMENT_METHOD_LABELS[order.paymentMethod]} />
        </ListSection>

        <div className="animate-rise flex flex-col gap-3" style={riseOrder(5)}>
          {order.store.whatsapp && !final && (
            <ButtonLink
              href={buildWhatsAppUrl(order.store.whatsapp, whatsappText)}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              variant="green"
              icon={<MessageCircle size={20} aria-hidden="true" />}
            >
              Kirim Pesanan via WhatsApp
            </ButtonLink>
          )}
          {showReceipt && (
            <ButtonLink
              href={`/pesanan/${order.token}/struk`}
              variant="tinted"
              fullWidth
              icon={<Receipt size={20} aria-hidden="true" />}
            >
              Lihat Struk
            </ButtonLink>
          )}
          {final && (
            <Button
              fullWidth
              loading={reordering}
              onClick={reorder}
              icon={<RotateCcw size={20} aria-hidden="true" />}
            >
              Pesan Lagi
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive-tinted" fullWidth onClick={() => setConfirmCancel(true)}>
              Batalkan Pesanan
            </Button>
          )}
          <Link href="/riwayat" className="tap py-2 text-center text-subhead text-tint">
            Lihat riwayat pesanan
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => !cancelling && setConfirmCancel(false)}
        title="Batalkan pesanan ini?"
        message={
          order.paymentMethod === 'QRIS' && order.hasPaymentProof
            ? 'Kalau sudah bayar, hubungi warung untuk pengembalian dana ya.'
            : 'Pesanan yang dibatalkan tidak bisa dikembalikan.'
        }
        actions={[
          { label: 'Tidak', style: 'cancel', onPress: () => setConfirmCancel(false) },
          { label: 'Ya, Batalkan', style: 'destructive', onPress: cancel, loading: cancelling },
        ]}
      />
    </>
  );
}
