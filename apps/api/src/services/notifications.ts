import { ORDER_TYPE_LABELS, formatRupiah, type OrderType, type PaymentMethod } from '@wtr/shared';
import { env } from '../env';
import { sendPushToAdmins } from '../lib/push';
import { sendWhatsAppToOwner } from '../lib/whatsapp-gateway';
import { getStoreSettingsRow } from './store';

interface NeedsActionOrder {
  id: string;
  code: string;
  total: number;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

/**
 * Pesanan yang menunggu tindakan pemilik: cash saat dibuat, QRIS saat bukti bayar masuk.
 * Web Push selalu dikirim; WhatsApp otomatis hanya bila gateway fase 2 aktif.
 */
export async function notifyOrderNeedsAction(order: NeedsActionOrder): Promise<void> {
  const title = order.paymentMethod === 'QRIS' ? 'Bukti bayar masuk!' : 'Pesanan baru!';
  const body = `#${order.code} · ${formatRupiah(order.total)} · ${ORDER_TYPE_LABELS[order.orderType]}`;
  const adminUrl = `/admin/pesanan/${order.id}`;

  const results = await Promise.allSettled([
    sendPushToAdmins({ title, body, url: adminUrl, tag: `order-${order.id}` }),
    (async () => {
      if (!env.WA_GATEWAY_TOKEN) return;
      const settings = await getStoreSettingsRow();
      const webOrigin = env.WEB_ORIGIN[0] ?? '';
      await sendWhatsAppToOwner(settings.whatsapp, `${title}\n${body}\n${webOrigin}${adminUrl}`);
    })(),
  ]);
  for (const result of results) {
    if (result.status === 'rejected') console.error('Notifikasi pesanan gagal', { code: order.code });
  }
}
