'use client';

import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  buildStatusUpdateForCustomer,
  buildWhatsAppUrl,
  formatDateTimeWIB,
  formatPhoneDisplay,
  formatRupiah,
  formatTimeWIB,
  type AdminOrderDto,
  type OptionSnapshot,
  type SignedUrlResponse,
  type StatusActor,
} from '@wtr/shared';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { WarungLoader } from '@/components/brand/warung-loader';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Copy, Flame, MapPin, MessageCircle, Phone, X } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { useOverlay } from '@/components/ui/sheet';
import { Chip, StatusBadge } from '@/components/ui/status-badge';
import { adminFetch, useAdminOrder } from '@/lib/admin-api';
import { useAdminLocal } from '@/lib/admin-store';
import { copyText } from '@/lib/device';
import { useNow } from '@/lib/hooks';
import { countdown } from '@/lib/time';
import { toast } from '@/lib/toast-store';
import { PrimaryActionButton, RejectSheet } from './order-actions';

const ACTOR_LABELS: Record<StatusActor, string> = { CUSTOMER: 'Pembeli', ADMIN: 'Pemilik', SYSTEM: 'Sistem' };

/** Opsi dengan ikon cabai untuk level pedas agar mudah dibaca dari dapur (PRD 8.3). */
function KitchenOptions({ options }: { options: OptionSnapshot[] }) {
  if (options.length === 0) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-callout text-label-2">
      {options.map((option) => {
        const level = /level\s*(\d)/i.exec(option.optionName);
        return (
          <span key={option.optionId} className="inline-flex items-center gap-0.5">
            {option.groupType === 'MULTIPLE' ? `+${option.optionName}` : option.optionName}
            {level && (
              <span className="inline-flex text-red" aria-hidden="true">
                {Array.from({ length: Number(level[1]) }, (_, i) => (
                  <Flame key={i} size={14} fill="currentColor" />
                ))}
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}

function ProofViewer({ url, onClose }: { url: string; onClose: () => void }) {
  useOverlay(true, onClose);
  return (
    <motion.div
      className="fixed inset-0 z-[80] overflow-auto bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Bukti bayar layar penuh"
    >
      {/* Pinch-zoom memakai zoom bawaan browser di atas gambar penuh. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="Bukti bayar" className="mx-auto min-h-full w-full object-contain [touch-action:pinch-zoom]" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="tap fixed top-[calc(env(safe-area-inset-top)+12px)] right-4 flex size-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur"
      >
        <X size={22} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

function PaymentProof({ order }: { order: AdminOrderDto }) {
  const [fullscreen, setFullscreen] = useState(false);
  const proof = useQuery({
    queryKey: ['admin', 'proof', order.id, order.paymentProofUploadedAt],
    queryFn: () => adminFetch<SignedUrlResponse>(`/orders/${order.id}/proof`),
    enabled: order.hasPaymentProof,
    // Signed URL berlaku 5 menit; minta ulang sebelum habis.
    staleTime: 4 * 60_000,
    refetchInterval: 4 * 60_000,
  });

  if (!order.hasPaymentProof) {
    if (!order.paymentProofUploadedAt) return null;
    return (
      <ListSection header="Bukti QRIS">
        <ListRow title="Bukti bayar sudah dihapus otomatis" subtitle="Disimpan maksimal 90 hari." />
      </ListSection>
    );
  }

  return (
    <ListSection header="Bukti QRIS">
      <div className="flex flex-col gap-3 p-4">
        <button
          type="button"
          onClick={() => proof.data && setFullscreen(true)}
          className="tap relative mx-auto flex aspect-[3/4] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-section bg-canvas"
          aria-label="Perbesar bukti bayar"
        >
          {proof.data ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={proof.data.url} alt="Bukti bayar QRIS" className="size-full object-contain" />
          ) : (
            <span className="text-footnote text-label-2">{proof.isError ? 'Gagal memuat bukti' : 'Ngambil foto buktinya…'}</span>
          )}
        </button>
        <p className="rounded-control bg-yellow-soft p-3 text-subhead text-yellow-text">
          Cocokkan nominal <strong>{formatRupiah(order.total)}</strong> dan waktu transaksi di aplikasi bank/merchant.
          Jangan hanya percaya screenshot.
        </p>
        {order.paymentProofUploadedAt && (
          <p className="text-center text-footnote text-label-2">Diupload {formatDateTimeWIB(order.paymentProofUploadedAt)}</p>
        )}
      </div>
      <AnimatePresence>
        {fullscreen && proof.data && <ProofViewer url={proof.data.url} onClose={() => setFullscreen(false)} />}
      </AnimatePresence>
    </ListSection>
  );
}

/** Isi detail pesanan admin; dipakai di halaman penuh (HP) dan panel kanan (desktop). */
export function AdminOrderDetail({ orderId }: { orderId: string }) {
  const { data: order, isPending, isError } = useAdminOrder(orderId);
  const markSeen = useAdminLocal((state) => state.markSeen);
  const [rejecting, setRejecting] = useState(false);
  const now = useNow(1000);

  useEffect(() => {
    markSeen(orderId);
  }, [orderId, markSeen]);

  if (isPending) return <WarungLoader topic="admin-pesanan" fill />;
  if (isError || !order) return <EmptyState title="Pesanan tidak ditemukan" />;

  const webOrigin = typeof window === 'undefined' ? '' : window.location.origin;
  const customerLink = `${webOrigin}/pesanan/${order.token}`;
  const updateText = buildStatusUpdateForCustomer({
    code: order.code,
    customerName: order.customerName,
    status: order.status,
    paymentMethod: order.paymentMethod,
    total: order.total,
    rejectionReason: order.rejectionReason,
    link: customerLink,
  });
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [order.address, order.landmark].filter(Boolean).join(' '),
  )}`;
  const canReject = order.status === 'AWAITING_CONFIRMATION';
  const hasPrimary = ['AWAITING_CONFIRMATION', 'PROCESSING', 'DELIVERING'].includes(order.status);
  const remaining = order.paymentDeadline ? Date.parse(order.paymentDeadline) - now : 0;

  return (
    <div className="flex flex-col gap-6 pb-28">
      <header className="flex flex-col gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-rounded text-title-1 font-bold">{order.code}</h1>
          <StatusBadge status={order.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-subhead text-label-2">
          <span>{formatDateTimeWIB(order.createdAt)}</span>
          <Chip>{ORDER_TYPE_LABELS[order.orderType]}</Chip>
          <Chip>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Chip>
        </div>
        {order.status === 'AWAITING_PAYMENT' && (
          <p className="text-subhead text-orange-text">Pembeli belum bayar · sisa {countdown(remaining)}</p>
        )}
        {order.rejectionReason && <p className="text-subhead text-red-text">Alasan ditolak: {order.rejectionReason}</p>}
      </header>

      <ListSection header="Pembeli">
        <ListRow title={order.customerName} subtitle={formatPhoneDisplay(order.customerPhone)} />
        <div className="flex gap-2 px-4 py-3">
          <ButtonLink
            href={buildWhatsAppUrl(order.customerPhone)}
            target="_blank"
            rel="noopener noreferrer"
            variant="tinted"
            size="md"
            className="flex-1"
            icon={<MessageCircle size={18} aria-hidden="true" />}
          >
            Chat WA
          </ButtonLink>
          <a
            href={`tel:+${order.customerPhone}`}
            className="tap inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-fill text-subhead font-semibold text-tint-pressed"
          >
            <Phone size={18} aria-hidden="true" /> Telepon
          </a>
        </div>
      </ListSection>

      {order.orderType === 'DELIVERY' && (
        <section className="flex flex-col gap-3 rounded-section bg-yellow-soft p-4">
          <div className="flex gap-2">
            <MapPin size={20} className="mt-0.5 shrink-0 text-yellow-text" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-callout text-label">{order.address}</p>
              {order.landmark && <p className="text-subhead text-label-2">Patokan: {order.landmark}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="md"
              variant="gray"
              className="flex-1 bg-white/70"
              icon={<Copy size={18} aria-hidden="true" />}
              onClick={async () => {
                const text = [order.address, order.landmark && `Patokan: ${order.landmark}`].filter(Boolean).join('\n');
                if (await copyText(text)) toast.success('Alamat disalin');
              }}
            >
              Salin Alamat
            </Button>
            <ButtonLink
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="md"
              variant="gray"
              className="flex-1 bg-white/70"
              icon={<MapPin size={18} aria-hidden="true" />}
            >
              Buka di Maps
            </ButtonLink>
          </div>
        </section>
      )}

      <ListSection header={`Item · ${order.items.reduce((sum, item) => sum + item.quantity, 0)}`}>
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-3 px-4 py-3">
            <span className="min-w-9 text-title-3 font-bold text-tint tabular-nums">{item.quantity}×</span>
            <div className="min-w-0 flex-1">
              <p className="text-title-3 font-semibold">{item.name}</p>
              <KitchenOptions options={item.options} />
            </div>
            <span className="shrink-0 text-callout tabular-nums">{formatRupiah(item.lineTotal)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-headline">Total · {PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
          <span className="text-title-2 font-bold tabular-nums">{formatRupiah(order.total)}</span>
        </div>
      </ListSection>

      {order.paymentMethod === 'QRIS' && <PaymentProof order={order} />}

      <ListSection header="Riwayat Status">
        {order.statusLogs.map((log) => (
          <ListRow
            key={`${log.status}-${log.at}`}
            title={ORDER_STATUS_LABELS[log.status]}
            subtitle={`${ACTOR_LABELS[log.actor]}${log.note ? ` · ${log.note}` : ''}`}
            value={formatTimeWIB(log.at)}
          />
        ))}
      </ListSection>

      <ButtonLink
        href={buildWhatsAppUrl(order.customerPhone, updateText)}
        target="_blank"
        rel="noopener noreferrer"
        variant="green"
        fullWidth
        icon={<MessageCircle size={20} aria-hidden="true" />}
      >
        Kirim Update ke Pembeli via WA
      </ButtonLink>

      {(hasPrimary || canReject) && (
        <div className="glass-strong sticky bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] z-20 flex gap-2 rounded-full p-2 lg:bottom-6">
          {canReject && (
            <Button variant="destructive-tinted" className="h-14 flex-1" onClick={() => setRejecting(true)}>
              Tolak
            </Button>
          )}
          <div className="flex-[2] [&>button]:h-14">
            <PrimaryActionButton order={order} place="detail" size="lg" fullWidth />
          </div>
        </div>
      )}

      <RejectSheet order={order} open={rejecting} onClose={() => setRejecting(false)} webOrigin={webOrigin} />
    </div>
  );
}
