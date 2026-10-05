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
import { useRef, useState } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Button, ButtonLink } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { Download, Share } from '@/components/ui/icons';
import { BackButton } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { copyText, downloadDataUrl } from '@/lib/device';
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

function Receipt({ order }: { order: PublicOrderDto }) {
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
          <span
            className={cn(
              '-rotate-6 rounded-[10px] border-[3px] px-4 py-1 font-sans text-title-3 font-black tracking-wider',
              paid ? 'border-green-text text-green-text' : 'border-orange-text text-orange-text',
            )}
          >
            {paid ? 'LUNAS' : 'BAYAR DI TEMPAT'}
          </span>
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
        <div className="mx-auto mt-6 w-full max-w-[360px] px-4">
          <Skeleton className="h-[520px] rounded-section" />
        </div>
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
        <div ref={receiptRef} className="w-full max-w-[360px] bg-canvas p-2">
          <div className="overflow-hidden rounded-t-[14px] drop-shadow-[0_8px_20px_rgb(0_0_0/0.08)]">
            <Receipt order={order} />
          </div>
        </div>
        <div className="flex w-full max-w-[360px] gap-3">
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
        </div>
      </div>
    </>
  );
}
