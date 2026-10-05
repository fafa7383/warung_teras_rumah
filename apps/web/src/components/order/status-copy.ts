import type { OrderStatus, PublicOrderDto } from '@wtr/shared';

/** Judul & pesan kartu status (tabel PRD 6.5). */
export function statusCopy(order: Pick<PublicOrderDto, 'status' | 'paymentMethod' | 'rejectionReason'>): {
  title: string;
  message: string;
} {
  const cash = order.paymentMethod === 'CASH';
  const copy: Record<OrderStatus, { title: string; message: string }> = {
    AWAITING_PAYMENT: {
      title: 'Selesaikan pembayaran ya',
      message: 'Bayar pakai QRIS di bawah sebelum waktunya habis.',
    },
    AWAITING_CONFIRMATION: {
      title: 'Pesanan sudah kami terima!',
      message: 'Pemilik warung sedang mengecek pesananmu.',
    },
    PROCESSING: { title: 'Pesananmu lagi dimasak', message: 'Sebentar lagi siap diantar.' },
    DELIVERING: {
      title: 'Pesanan lagi di jalan',
      message: cash ? 'Pesananmu sedang diantar. Siapkan uang pas kalau bayar cash ya.' : 'Pesananmu sedang diantar.',
    },
    COMPLETED: { title: 'Selamat menikmati!', message: 'Terima kasih sudah jajan di Teras Rumah.' },
    CONFIRMED: {
      title: 'Pesananmu sudah dikonfirmasi',
      message: cash
        ? 'Silakan tunggu, makanan segera disiapkan. Bayar di kasir kalau pilih cash.'
        : 'Silakan tunggu, makanan segera disiapkan.',
    },
    REJECTED: {
      title: 'Maaf, pesanan tidak bisa diproses',
      message: order.rejectionReason ? `Alasan: ${order.rejectionReason}.` : 'Pemilik warung tidak bisa memproses pesanan ini.',
    },
    EXPIRED: { title: 'Waktu pembayaran habis', message: 'Pesanan dibatalkan otomatis. Kamu bisa pesan lagi.' },
    CANCELLED: { title: 'Pesanan dibatalkan', message: 'Pesanan ini sudah kamu batalkan.' },
  };
  return copy[order.status];
}

/** Struk tersedia setelah pemilik mengonfirmasi pesanan (PRD 6.6). */
export const RECEIPT_STATUSES: readonly OrderStatus[] = ['CONFIRMED', 'PROCESSING', 'DELIVERING', 'COMPLETED'];

/** "LUNAS" untuk QRIS terverifikasi atau cash yang sudah selesai; selain itu "BAYAR DI TEMPAT". */
export function isPaid(order: Pick<PublicOrderDto, 'status' | 'paymentMethod'>): boolean {
  if (order.paymentMethod === 'QRIS') return RECEIPT_STATUSES.includes(order.status);
  return order.status === 'COMPLETED';
}
