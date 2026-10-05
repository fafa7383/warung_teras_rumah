import type { OrderStatus, OrderType, PaymentMethod } from './enums';
import { formatRupiah } from './format';
import { ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS } from './order-status';
import { formatOptionSummary, type OptionSnapshot } from './pricing';

export interface OrderMessageInput {
  code: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  customerName: string;
  address?: string | null;
  landmark?: string | null;
  total: number;
  items: readonly { name: string; quantity: number; lineTotal: number; options: OptionSnapshot[] }[];
  link: string;
}

/** Teks "Kirim Pesanan via WhatsApp" dari pembeli ke nomor warung (PRD B-12). */
export function buildOrderMessageForStore(order: OrderMessageInput): string {
  const lines = [
    'Halo Warung Teras Rumah, saya sudah pesan lewat website:',
    '',
    `*Pesanan ${order.code}*`,
    `Nama: ${order.customerName}`,
    `Cara pesan: ${ORDER_TYPE_LABELS[order.orderType]}`,
  ];
  if (order.orderType === 'DELIVERY' && order.address) {
    lines.push(`Alamat: ${order.address}`);
    if (order.landmark) lines.push(`Patokan: ${order.landmark}`);
  }
  lines.push('');
  for (const item of order.items) {
    const options = formatOptionSummary(item.options);
    lines.push(
      `${item.quantity}× ${item.name}${options ? ` (${options})` : ''} — ${formatRupiah(item.lineTotal)}`,
    );
  }
  lines.push(
    '',
    `Total: *${formatRupiah(order.total)}* (${PAYMENT_METHOD_LABELS[order.paymentMethod]})`,
    `Lihat pesanan: ${order.link}`,
  );
  return lines.join('\n');
}

export interface StatusUpdateInput {
  code: string;
  customerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  total: number;
  rejectionReason?: string | null;
  /** QRIS yang sudah dibayar lalu ditolak: minta data untuk refund manual. */
  refundNeeded?: boolean;
  link: string;
}

/** Teks "Kirim Update ke Pembeli via WA" dari dashboard admin (PRD A-12). */
export function buildStatusUpdateForCustomer(input: StatusUpdateInput): string {
  const { code } = input;
  const total = formatRupiah(input.total);
  const cash = input.paymentMethod === 'CASH';

  const messages: Record<OrderStatus, string> = {
    AWAITING_PAYMENT: `Pesanan ${code} masih menunggu pembayaran QRIS sebesar ${total}. Upload bukti bayarnya lewat link di bawah ya.`,
    AWAITING_CONFIRMATION: `Pesanan ${code} sudah kami terima dan sedang kami cek.`,
    CONFIRMED: `Pesanan ${code} sudah dikonfirmasi. Silakan tunggu, makanan segera disiapkan.${cash ? ' Bayar di kasir ya.' : ''}`,
    PROCESSING: `Pesanan ${code} sedang kami masak. Sebentar lagi diantar ya.`,
    DELIVERING: `Pesanan ${code} sedang diantar.${cash ? ` Siapkan uang pas ${total} ya.` : ''}`,
    COMPLETED: `Pesanan ${code} sudah selesai. Terima kasih sudah jajan di Teras Rumah!`,
    REJECTED: `Mohon maaf, pesanan ${code} tidak bisa kami proses.${input.rejectionReason ? ` Alasannya: ${input.rejectionReason}.` : ''}${input.refundNeeded ? ` Pembayaran ${total} akan kami kembalikan. Boleh dibalas dengan nomor rekening/e-wallet tujuan refund?` : ''}`,
    EXPIRED: `Waktu pembayaran pesanan ${code} sudah habis, jadi pesanan dibatalkan otomatis. Silakan pesan lagi ya.`,
    CANCELLED: `Pesanan ${code} sudah dibatalkan.`,
  };

  return [
    `Halo Kak ${input.customerName}, ini dari Warung Teras Rumah.`,
    '',
    messages[input.status],
    '',
    `Detail pesanan: ${input.link}`,
  ].join('\n');
}
