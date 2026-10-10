'use client';

import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  formatDateTimeWIB,
  formatOptionSummary,
  formatPhoneDisplay,
  formatRupiah,
  type PublicOrderDto,
} from '@wtr/shared';
import { toPng } from 'html-to-image';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { WarungLoader } from '@/components/brand/warung-loader';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Download, Share } from '@/components/ui/icons';
import { BackButton } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { copyText, downloadDataUrl } from '@/lib/device';
import { spring } from '@/lib/motion';
import { useOrderQuery } from '@/lib/queries';
import { toast } from '@/lib/toast-store';
import { RECEIPT_STATUSES, isPaid } from './status-copy';

const RECEIPT_WIDTH = 360;

/** Tepi bawah bergerigi khas struk kasir. */
function ZigzagEdge() {
  const tooth = 12;
  let path = `M0 0H${RECEIPT_WIDTH}`;
  for (let x = RECEIPT_WIDTH; x > 0; x -= tooth) path += `L${x - tooth / 2} ${tooth}L${x - tooth} 0`;
  return (
    <svg viewBox={`0 0 ${RECEIPT_WIDTH} ${tooth}`} preserveAspectRatio="none" className="block h-3 w-full" aria-hidden="true">
      <path d={`${path}Z`} fill="#fff" />
    </svg>
  );
}

function Dashed() {
  return <div className="my-3 border-t border-dashed border-label-3" aria-hidden="true" />;
}

function Receipt({ order, stampDelay = 0 }: { order: PublicOrderDto; stampDelay?: number }) {
  const paid = isPaid(order);
  return (
    <div className="relative">
      <div className="bg-white px-5 pt-6 pb-4 font-mono text-[13px] leading-[18px] text-label">
        <div className="flex flex-col items-center gap-1.5 text-center font-sans">
          <LogoMark size={40} />
          <p className="font-rounded text-headline">{order.store.name}</p>
          {order.store.address && <p className="text-footnote text-label-2">{order.store.address}</p>}
          {order.store.whatsapp && (
            <p className="text-footnote text-label-2">WA {formatPhoneDisplay(order.store.whatsapp)}</p>
          )}
        </div>
        <Dashed />
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          <dt className="text-label-2">Kode</dt>
          <dd className="text-right font-bold">{order.code}</dd>
          <dt className="text-label-2">Waktu</dt>
          <dd className="text-right">{formatDateTimeWIB(order.createdAt)}</dd>
          <dt className="text-label-2">Cara pesan</dt>
          <dd className="text-right">{ORDER_TYPE_LABELS[order.orderType]}</dd>
          <dt className="text-label-2">Nama</dt>
          <dd className="truncate text-right">{order.customerName}</dd>
        </dl>
        <Dashed />
        <ul className="flex flex-col gap-2">
          {order.items.map((item) => {
            const summary = formatOptionSummary(item.options);
            return (
              <li key={item.id}>
                <p className="font-bold">{item.name}</p>
                {summary && <p className="text-label-2">{summary}</p>}
                <div className="flex justify-between">
                  <span>
                    {item.quantity} × {formatRupiah(item.unitPrice)}
                  </span>
                  <span>{formatRupiah(item.lineTotal)}</span>
                </div>
              </li>
            );
          })}
        </ul>
        <Dashed />
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatRupiah(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Ongkir</span>
          <span>{order.deliveryFee === 0 ? 'Gratis' : formatRupiah(order.deliveryFee)}</span>
        </div>
        <div className="mt-1 flex justify-between font-sans text-title-3 font-bold">
          <span>TOTAL</span>
          <span>{formatRupiah(order.total)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Pembayaran</span>
          <span>{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
        </div>

        <div className="mt-5 flex justify-center">
          {/* Cap dihentakkan setelah struk selesai keluar. */}
          <motion.span
            initial={{ scale: 2.4, opacity: 0, rotate: -24 }}
            animate={{ scale: 1, opacity: 1, rotate: -6 }}
            transition={{ type: 'spring', stiffness: 520, damping: 18, delay: stampDelay }}
            className={cn(
              'rounded-[10px] border-[3px] px-4 py-1 font-sans text-title-3 font-black tracking-wider',
              paid ? 'border-green-text text-green-text' : 'border-orange-text text-orange-text',
            )}
          >
            {paid ? 'LUNAS' : 'BAYAR DI TEMPAT'}
          </motion.span>
        </div>
        <p className="mt-5 text-center font-sans text-subhead">Terima kasih sudah jajan di Teras Rumah!</p>
      </div>
      <ZigzagEdge />
    </div>
  );
}

/** Struk digital yang bisa diunduh sebagai PNG dan dibagikan (PRD 6.6, B-10). */
export function ReceiptView({ token }: { token: string }) {
  const { data: order, isPending } = useOrderQuery(token);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const download = async () => {
    if (!receiptRef.current || !order) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { pixelRatio: 3, cacheBust: true, backgroundColor: '#F2F2F7' });
      downloadDataUrl(dataUrl, `Struk-${order.code}.png`);
      toast.success('Struk tersimpan');
    } catch {
      toast.error('Struk gagal diunduh, coba lagi ya');
    } finally {
      setSaving(false);
    }
  };

  const share = async () => {
    if (!order) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Struk ${order.code}`, text: `Struk pesanan ${order.code} di Warung Teras Rumah`, url });
      } catch {
        // dibatalkan pengguna
      }
      return;
    }
    if (await copyText(url)) toast.success('Link struk disalin');
  };

  const header = (
    <div className="glass hairline-b sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="mx-auto flex h-bar max-w-2xl items-center gap-2 px-4">
        <BackButton fallbackHref={`/pesanan/${token}`} />
        <p className="flex-1 text-center text-headline">Struk</p>
        <span className="size-11" aria-hidden="true" />
      </div>
    </div>
  );

  if (isPending) {
    return (
      <>
        {header}
        <WarungLoader topic="struk" fill />
      </>
    );
  }

  if (!order || !RECEIPT_STATUSES.includes(order.status)) {
    return (
      <>
        {header}
        <EmptyState
          title="Struk belum tersedia"
          message="Struk bisa dilihat setelah pemilik warung mengonfirmasi pesananmu."
          action={
            <ButtonLink href={`/pesanan/${token}`} fullWidth>
              Lihat Status Pesanan
            </ButtonLink>
          }
        />
      </>
    );
  }

  return (
    <>
      {header}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="relative w-full max-w-[376px]">
          {/* "Mulut printer": struk keluar dari celah ini. */}
          <div className="relative z-10 mx-auto h-3 w-full rounded-full bg-gradient-to-b from-[#3a3a3c] to-[#1d1d1f] shadow-[0_4px_10px_rgb(0_0_0/0.25)]" aria-hidden="true" />
          <div className="-mt-1.5 overflow-hidden px-2">
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1.3, ease: [0.45, 0, 0.2, 1] }}
            >
              <div ref={receiptRef} className="bg-canvas p-2">
                <div className="overflow-hidden rounded-t-[4px] drop-shadow-[0_8px_20px_rgb(0_0_0/0.08)]">
                  <Receipt order={order} stampDelay={1.25} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <motion.div
          className="flex w-full max-w-[360px] gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.gentle, delay: 1.5 }}
        >
          <Button
            variant="filled"
            fullWidth
            loading={saving}
            onClick={download}
            icon={<Download size={20} aria-hidden="true" />}
          >
            Unduh Struk
          </Button>
          <Button variant="tinted" fullWidth onClick={share} icon={<Share size={20} aria-hidden="true" />}>
            Bagikan
          </Button>
        </motion.div>
      </div>
    </>
  );
}
