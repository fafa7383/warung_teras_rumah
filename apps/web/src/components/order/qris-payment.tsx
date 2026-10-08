'use client';

import {
  MAX_UPLOAD_BYTES,
  PAYMENT_PROOF_GRACE_MS,
  QRIS_PAYMENT_WINDOW_MS,
  buildWhatsAppUrl,
  formatRupiah,
  type PublicOrderDto,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, ImagePlus, MessageCircle, Timer, X } from '@/components/ui/icons';
import { useOverlay } from '@/components/ui/sheet';
import { ApiError, apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { compressImage, copyText, downloadDataUrl, vibrate } from '@/lib/device';
import { useNow } from '@/lib/hooks';
import { spring } from '@/lib/motion';
import { queryKeys } from '@/lib/queries';
import { toast } from '@/lib/toast-store';

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Cincin hitung mundur: berkurang mulus tiap detik, merah saat < 2 menit. */
function CountdownRing({ progress, urgent }: { progress: number; urgent: boolean }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="rgb(0 0 0 / 0.08)" strokeWidth="6" />
      <motion.circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={false}
        animate={{
          strokeDashoffset: circumference * (1 - Math.min(1, progress)),
          stroke: urgent ? '#FF3B30' : '#FF9500',
        }}
        transition={{ strokeDashoffset: { duration: 1, ease: 'linear' }, stroke: { duration: 0.4 } }}
      />
    </svg>
  );
}

/** Simpan QRIS sebagai PNG agar bisa dipindai dari galeri di aplikasi e-wallet/m-banking. */
async function saveQrisImage(url: string, code: string) {
  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    downloadDataUrl(canvas.toDataURL('image/png'), `QRIS-Teras-Rumah-${code}.png`);
    toast.success('Gambar QRIS tersimpan');
  } catch {
    // Cadangan: buka gambar di tab baru agar bisa disimpan manual (tekan lama).
    window.open(url, '_blank', 'noopener');
  }
}

function QrisZoom({ url, onClose }: { url: string; onClose: () => void }) {
  useOverlay(true, onClose);
  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="QRIS diperbesar"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="QRIS warung" className="max-h-full max-w-full rounded-section bg-white p-3" />
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="tap absolute top-[calc(env(safe-area-inset-top)+16px)] right-4 flex size-11 items-center justify-center rounded-full bg-white/20 text-white"
      >
        <X size={22} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

/** Blok pembayaran QRIS saat Menunggu Pembayaran (PRD 6.5). */
export function QrisPayment({ order }: { order: PublicOrderDto }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [zoom, setZoom] = useState(false);
  const now = useNow(1000);

  // Selisih jam HP dengan jam server agar timer tetap akurat walau jam HP salah.
  const clockOffset = useMemo(() => Date.parse(order.serverTime) - Date.now(), [order.serverTime]);
  const deadline = order.paymentDeadline ? Date.parse(order.paymentDeadline) : now;
  const remaining = deadline - (now + clockOffset);
  const expired = remaining <= -PAYMENT_PROOF_GRACE_MS;
  const qrisUrl = order.payment?.qrisImageUrl ?? null;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pickFile = async (picked: File | undefined) => {
    if (!picked) return;
    if (!/^image\/(jpeg|png|webp)$/.test(picked.type)) {
      toast.error('Foto harus JPG, PNG, atau WEBP ya');
      return;
    }
    const compressed = await compressImage(picked);
    if (compressed.size > MAX_UPLOAD_BYTES) {
      toast.error('Ukuran foto maksimal 5 MB');
      return;
    }
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const updated = await apiFetch<PublicOrderDto>(`/api/orders/${encodeURIComponent(order.token)}/payment-proof`, {
        method: 'POST',
        body,
      });
      queryClient.setQueryData(queryKeys.order(order.token), updated);
      vibrate([10, 40, 10]);
      toast.success('Bukti terkirim! Pemilik warung sedang mengecek.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Upload gagal, coba lagi ya');
      if (error instanceof ApiError && error.code === 'PAYMENT_EXPIRED') {
        await queryClient.invalidateQueries({ queryKey: queryKeys.order(order.token) });
      }
    } finally {
      setUploading(false);
    }
  };

  if (expired) {
    return (
      <section className="rounded-card bg-surface p-5 text-center shadow-card">
        <p className="text-headline">Waktu pembayaran habis</p>
        <p className="mt-1 text-subhead text-label-2">Pesanan dibatalkan otomatis. Kamu bisa pesan lagi.</p>
      </section>
    );
  }

  const urgent = remaining < 2 * 60_000;

  return (
    <section aria-label="Pembayaran QRIS" className="overflow-hidden rounded-card bg-surface shadow-card">
      <motion.div
        className="flex items-center gap-4 px-5 py-4"
        animate={{ backgroundColor: urgent ? '#FFECEB' : '#FFF3E0' }}
        transition={{ duration: 0.6 }}
      >
        <CountdownRing progress={Math.max(0, remaining) / QRIS_PAYMENT_WINDOW_MS} urgent={urgent} />
        <div className="flex flex-col">
          <span className={cn('flex items-center gap-1.5 text-footnote font-semibold', urgent ? 'text-red-text' : 'text-orange-text')}>
            <Timer size={16} aria-hidden="true" /> Sisa waktu bayar
          </span>
          <motion.span
            className={cn('font-rounded text-large-title font-bold tabular-nums', urgent ? 'text-red-text' : 'text-orange-text')}
            role="timer"
            aria-live="off"
            animate={urgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={urgent ? { duration: 1, repeat: Infinity } : { duration: 0.2 }}
          >
            {formatCountdown(remaining)}
          </motion.span>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-1 px-5 pt-5">
        <span className="text-footnote text-label-2">Total yang harus dibayar</span>
        <div className="flex items-center gap-2">
          <span className="font-rounded text-title-1 font-bold">{formatRupiah(order.total)}</span>
          <button
            type="button"
            onClick={async () => {
              if (await copyText(String(order.total))) toast.success('Nominal disalin');
            }}
            aria-label="Salin nominal"
            className="tap flex size-9 items-center justify-center rounded-full bg-fill text-tint"
          >
            <Copy size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        {qrisUrl ? (
          <>
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="tap mx-auto block w-full max-w-[280px] rounded-section bg-white p-3 ring-1 ring-black/5"
              aria-label="Perbesar QRIS"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrisUrl} alt={`QRIS ${order.payment?.qrisMerchantName ?? 'Warung Teras Rumah'}`} className="w-full" />
            </button>
            {order.payment?.qrisMerchantName && (
              <p className="mt-2 text-center text-footnote text-label-2">a.n. {order.payment.qrisMerchantName}</p>
            )}
            <Button
              variant="gray"
              size="md"
              fullWidth
              className="mt-3"
              icon={<Download size={18} aria-hidden="true" />}
              onClick={() => saveQrisImage(qrisUrl, order.code)}
            >
              Simpan Gambar QRIS
            </Button>
          </>
        ) : (
          <div className="rounded-section bg-fill p-4 text-center">
            <p className="text-subhead">QRIS warung belum tersedia.</p>
            {order.store.whatsapp && (
              <a
                href={buildWhatsAppUrl(order.store.whatsapp, `Halo, saya mau bayar QRIS untuk pesanan ${order.code}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="tap mt-2 inline-flex items-center gap-1 text-subhead font-semibold text-green-text"
              >
                <MessageCircle size={16} aria-hidden="true" /> Hubungi warung
              </a>
            )}
          </div>
        )}
      </div>

      <ol className="mx-5 mt-5 flex flex-col gap-2.5 rounded-section bg-canvas p-4 text-subhead">
        {['Simpan atau scan QRIS', `Bayar sesuai total ${formatRupiah(order.total)}`, 'Upload bukti bayar di bawah'].map(
          (step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-tint text-caption font-bold text-white">
                {index + 1}
              </span>
              {step}
            </li>
          ),
        )}
      </ol>

      <div className="p-5">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="bukti-bayar"
          onChange={(event) => {
            void pickFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <AnimatePresence mode="wait" initial={false}>
          {preview ? (
            <motion.div
              key={preview}
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={spring.smooth}
              className="flex items-center gap-3 rounded-section bg-canvas p-3"
            >
              <motion.img
                src={preview}
                alt="Pratinjau bukti bayar"
                className="size-20 rounded-control object-cover"
                initial={{ rotate: -6, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={spring.bouncy}
              />
              <div className="min-w-0 flex-1">
                <p className="text-subhead font-semibold">Bukti bayar siap dikirim</p>
                <button type="button" onClick={() => inputRef.current?.click()} className="tap text-subhead text-tint">
                  Ganti foto
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.label
              key="picker"
              htmlFor="bukti-bayar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              whileTap={{ scale: 0.97 }}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-section border-2 border-dashed border-label-3 px-4 py-6 text-center transition-colors hover:border-tint"
            >
              <motion.span
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="inline-flex"
              >
                <ImagePlus size={28} className="text-tint" aria-hidden="true" />
              </motion.span>
              <span className="text-headline">Pilih foto bukti bayar</span>
              <span className="text-footnote text-label-2">Kamera atau galeri · JPG, PNG, WEBP · maks. 5 MB</span>
            </motion.label>
          )}
        </AnimatePresence>
        <Button fullWidth className={cn('mt-4', file && !uploading && 'shine')} disabled={!file} loading={uploading} onClick={upload}>
          Kirim Bukti Pembayaran
        </Button>
      </div>

      <AnimatePresence>{zoom && qrisUrl && <QrisZoom url={qrisUrl} onClose={() => setZoom(false)} />}</AnimatePresence>
    </section>
  );
}
