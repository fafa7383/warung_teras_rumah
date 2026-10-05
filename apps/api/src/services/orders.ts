import {
  PAYMENT_PROOF_GRACE_MS,
  PAYMENT_PROOF_RETENTION_DAYS,
  QRIS_PAYMENT_WINDOW_MS,
  calculateOrderTotals,
  canTransition,
  getAdvanceTargetStatus,
  getConfirmTargetStatus,
  getInitialStatus,
  priceSelection,
  validateSelection,
  type CartLinePayload,
  type CartLineStatus,
  type CartValidateResponse,
  type CreateOrderPayload,
  type OrderStatus,
  type SelectionIssue,
  type StatusActor,
  type ValidatedCartLine,
} from '@wtr/shared';
import type { Prisma } from '../generated/prisma/client';
import { publishAdminEvent } from '../lib/events';
import { HttpError } from '../lib/http-error';
import { processImage } from '../lib/images';
import { generateAccessToken, generateOrderCode, hashIp, isUniqueViolation } from '../lib/order-code';
import { prisma } from '../lib/prisma';
import { removePrivateFiles, uploadPrivateFile } from '../lib/storage';
import { menuItemInclude, toPricingMenuItem, type MenuItemRow } from './menu';
import { notifyOrderNeedsAction } from './notifications';
import { assertStoreOpen, getStoreSnapshot } from './store';

export const orderInclude = {
  items: { orderBy: { sortOrder: 'asc' } },
  statusLogs: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const ORDERS_PER_PHONE_PER_HOUR = 5;
const PHONE_RATE_LIMIT_MESSAGE = 'Kamu baru saja memesan beberapa kali. Coba lagi beberapa menit lagi ya.';
const STALE_STATUS_MESSAGE = 'Status pesanan sudah berubah, muat ulang dulu ya';

function notFound(): never {
  throw new HttpError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan');
}

async function loadMenuRows(menuItemIds: string[]): Promise<Map<string, MenuItemRow>> {
  const rows = await prisma.menuItem.findMany({
    where: { id: { in: [...new Set(menuItemIds)] }, deletedAt: null, category: { isActive: true } },
    include: menuItemInclude,
  });
  return new Map(rows.map((row) => [row.id, row]));
}

function lineStatus(issues: SelectionIssue[]): CartLineStatus {
  if (issues.length === 0) return 'OK';
  if (issues.some((issue) => issue.code === 'MENU_UNAVAILABLE')) return 'UNAVAILABLE';
  return 'INVALID_OPTIONS';
}

/** POST /cart/validate: harga & ketersediaan terbaru untuk isi keranjang di HP pembeli (PRD B-05). */
export async function validateCart(items: CartLinePayload[]): Promise<CartValidateResponse> {
  const [rows, store] = await Promise.all([loadMenuRows(items.map((i) => i.menuItemId)), getStoreSnapshot()]);
  const lines: ValidatedCartLine[] = items.map((line, index) => {
    const row = rows.get(line.menuItemId);
    if (!row) {
      return { index, menuItemId: line.menuItemId, status: 'NOT_FOUND', name: null, slug: null, imageUrl: null, unitPrice: null, options: [] };
    }
    const menu = toPricingMenuItem(row);
    const priced = priceSelection(menu, line.optionIds, line.quantity);
    return {
      index,
      menuItemId: row.id,
      status: lineStatus(validateSelection(menu, line.optionIds, line.quantity)),
      name: row.name,
      slug: row.slug,
      imageUrl: row.imageUrl,
      unitPrice: priced.unitPrice,
      options: priced.options,
    };
  });
  return { lines, storeOpen: store.status.isOpen };
}

/** POST /orders. Harga selalu dihitung ulang di server; angka dari browser diabaikan (PRD 10.6). */
export async function createOrder(input: CreateOrderPayload, meta: { ip?: string }): Promise<OrderRow> {
  await assertStoreOpen();

  const recentOrders = await prisma.order.count({
    where: { customerPhone: input.customerPhone, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
  });
  if (recentOrders >= ORDERS_PER_PHONE_PER_HOUR) {
    throw new HttpError(429, 'RATE_LIMITED', PHONE_RATE_LIMIT_MESSAGE);
  }

  const rows = await loadMenuRows(input.items.map((line) => line.menuItemId));
  const problems: { index: number; menuItemId: string; status: CartLineStatus }[] = [];
  const priced = input.items.flatMap((line, index) => {
    const row = rows.get(line.menuItemId);
    if (!row) {
      problems.push({ index, menuItemId: line.menuItemId, status: 'NOT_FOUND' });
      return [];
    }
    const menu = toPricingMenuItem(row);
    const issues = validateSelection(menu, line.optionIds, line.quantity);
    if (issues.length > 0) {
      problems.push({ index, menuItemId: line.menuItemId, status: lineStatus(issues) });
      return [];
    }
    return [{ row, line: priceSelection(menu, line.optionIds, line.quantity) }];
  });

  if (problems.length > 0) {
    const soldOut = problems.some((p) => p.status !== 'INVALID_OPTIONS');
    throw new HttpError(
      409,
      'ITEMS_INVALID',
      soldOut ? 'Ada menu yang habis, hapus dulu ya' : 'Ada pilihan menu yang perlu dicek lagi',
      problems,
    );
  }

  const totals = calculateOrderTotals(priced.map((p) => p.line));
  if (input.expectedTotal !== undefined && input.expectedTotal !== totals.total) {
    throw new HttpError(409, 'PRICE_CHANGED', 'Ada harga yang berubah, cek lagi ya');
  }

  const status = getInitialStatus(input.paymentMethod);
  const isDelivery = input.orderType === 'DELIVERY';
  const now = Date.now();

  for (let attempt = 1; ; attempt++) {
    try {
      const order = await prisma.order.create({
        data: {
          code: generateOrderCode(),
          accessToken: generateAccessToken(),
          orderType: input.orderType,
          paymentMethod: input.paymentMethod,
          status,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          address: isDelivery ? (input.address ?? null) : null,
          landmark: isDelivery ? (input.landmark ?? null) : null,
          subtotal: totals.subtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          paymentDeadline: input.paymentMethod === 'QRIS' ? new Date(now + QRIS_PAYMENT_WINDOW_MS) : null,
          ipHash: hashIp(meta.ip),
          items: {
            create: priced.map(({ row, line }, index) => ({
              menuItemId: row.id,
              nameSnapshot: row.name,
              basePriceSnapshot: row.basePrice,
              optionsSnapshot: line.options,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              lineTotal: line.lineTotal,
              sortOrder: index,
            })),
          },
          statusLogs: { create: { fromStatus: null, toStatus: status, actor: 'CUSTOMER' } },
        },
        include: orderInclude,
      });

      publishAdminEvent({
        type: 'order.created',
        order: { id: order.id, code: order.code, status: order.status, total: order.total },
      });
      if (order.status === 'AWAITING_CONFIRMATION') void notifyOrderNeedsAction(order);
      return order;
    } catch (error) {
      // Kode/token bentrok (sangat jarang): coba buat ulang.
      if (isUniqueViolation(error) && attempt < 5) continue;
      throw error;
    }
  }
}

/**
 * Pindah status lewat state machine (PRD Bagian 7) dan catat ke order_status_logs.
 * Update dijaga `status` lama agar dua aksi bersamaan tidak saling menimpa.
 */
export async function transitionOrder(
  order: OrderRow,
  to: OrderStatus,
  actor: StatusActor,
  extra: { note?: string | null; data?: Prisma.OrderUpdateManyMutationInput } = {},
): Promise<OrderRow> {
  if (!canTransition(order.status, to, actor, order)) {
    throw new HttpError(409, 'INVALID_TRANSITION', STALE_STATUS_MESSAGE);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { ...extra.data, status: to },
    });
    if (result.count === 0) return null;
    await tx.orderStatusLog.create({
      data: { orderId: order.id, fromStatus: order.status, toStatus: to, actor, note: extra.note ?? null },
    });
    return tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  });
  if (!updated) throw new HttpError(409, 'INVALID_TRANSITION', STALE_STATUS_MESSAGE);

  publishAdminEvent({
    type: 'order.updated',
    order: { id: updated.id, code: updated.code, status: updated.status, total: updated.total },
  });
  if (to === 'AWAITING_CONFIRMATION') void notifyOrderNeedsAction(updated);
  return updated;
}

function isPaymentOverdue(order: OrderRow, now = Date.now()) {
  return (
    order.status === 'AWAITING_PAYMENT' &&
    order.paymentDeadline !== null &&
    order.paymentDeadline.getTime() + PAYMENT_PROOF_GRACE_MS < now
  );
}

/** Kedaluwarsa juga dicek saat pesanan dibaca, tidak hanya oleh job tiap menit (PRD 10.6). */
async function expireIfOverdue(order: OrderRow): Promise<OrderRow> {
  if (!isPaymentOverdue(order)) return order;
  try {
    return await transitionOrder(order, 'EXPIRED', 'SYSTEM');
  } catch (error) {
    if (error instanceof HttpError && error.code === 'INVALID_TRANSITION') {
      return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    }
    throw error;
  }
}

export async function getOrderByToken(token: string): Promise<OrderRow> {
  const order = await prisma.order.findUnique({ where: { accessToken: token }, include: orderInclude });
  if (!order) notFound();
  return expireIfOverdue(order);
}

export async function getOrderById(id: string): Promise<OrderRow> {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) notFound();
  return expireIfOverdue(order);
}

export async function getOrdersByTokens(tokens: string[]): Promise<OrderRow[]> {
  const orders = await prisma.order.findMany({
    where: { accessToken: { in: tokens } },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(orders.map(expireIfOverdue));
}

export async function lookupOrder(code: string, phone: string): Promise<OrderRow> {
  const order = await prisma.order.findUnique({ where: { code }, include: orderInclude });
  // Pesan sama untuk kode salah maupun nomor salah agar tidak bisa ditebak.
  if (!order || order.customerPhone !== phone) {
    throw new HttpError(404, 'ORDER_NOT_FOUND', 'Pesanan tidak ditemukan. Cek lagi kode dan nomornya ya.');
  }
  return order;
}

export async function cancelOrderByCustomer(token: string): Promise<OrderRow> {
  const order = await getOrderByToken(token);
  if (!canTransition(order.status, 'CANCELLED', 'CUSTOMER', order)) {
    throw new HttpError(409, 'CANNOT_CANCEL', 'Pesanan ini sudah tidak bisa dibatalkan');
  }
  return transitionOrder(order, 'CANCELLED', 'CUSTOMER');
}

/** Upload bukti QRIS: hanya saat Menunggu Pembayaran dan sebelum batas waktu + toleransi 30 detik. */
export async function uploadPaymentProof(token: string, file: Buffer): Promise<OrderRow> {
  const order = await getOrderByToken(token);
  if (order.status === 'EXPIRED') {
    throw new HttpError(409, 'PAYMENT_EXPIRED', 'Waktu pembayaran sudah habis');
  }
  if (order.status !== 'AWAITING_PAYMENT' || order.paymentMethod !== 'QRIS') {
    throw new HttpError(409, 'NOT_AWAITING_PAYMENT', 'Pesanan ini tidak sedang menunggu pembayaran');
  }

  const image = await processImage(file, 'proof');
  const path = `${order.id}/${Date.now()}.webp`;
  await uploadPrivateFile(path, image, 'image/webp');

  // Cek ulang setelah upload yang mungkin lambat.
  const fresh = await getOrderByToken(token);
  if (fresh.status !== 'AWAITING_PAYMENT') {
    await removePrivateFiles([path]).catch(() => undefined);
    throw new HttpError(409, 'PAYMENT_EXPIRED', 'Waktu pembayaran sudah habis');
  }
  return transitionOrder(fresh, 'AWAITING_CONFIRMATION', 'CUSTOMER', {
    data: { paymentProofPath: path, paymentProofUploadedAt: new Date() },
  });
}

/** Terima pembayaran / Konfirmasi: dine-in → Dikonfirmasi, delivery → Diproses. */
export async function confirmOrder(id: string): Promise<OrderRow> {
  const order = await getOrderById(id);
  if (order.status !== 'AWAITING_CONFIRMATION') throw new HttpError(409, 'INVALID_TRANSITION', STALE_STATUS_MESSAGE);
  return transitionOrder(order, getConfirmTargetStatus(order.orderType), 'ADMIN');
}

export async function rejectOrder(id: string, reason: string): Promise<OrderRow> {
  const order = await getOrderById(id);
  return transitionOrder(order, 'REJECTED', 'ADMIN', { note: reason, data: { rejectionReason: reason } });
}

/** Diproses → Diantar → Selesai. */
export async function advanceOrder(id: string): Promise<OrderRow> {
  const order = await getOrderById(id);
  const target = getAdvanceTargetStatus(order.status);
  if (!target) throw new HttpError(409, 'INVALID_TRANSITION', STALE_STATUS_MESSAGE);
  return transitionOrder(order, target, 'ADMIN');
}

/** Job tiap menit: pesanan QRIS lewat batas bayar → Kedaluwarsa. */
export async function expireOverdueOrders(): Promise<number> {
  const overdue = await prisma.order.findMany({
    where: {
      status: 'AWAITING_PAYMENT',
      paymentDeadline: { lt: new Date(Date.now() - PAYMENT_PROOF_GRACE_MS) },
    },
    include: orderInclude,
    take: 100,
  });
  for (const order of overdue) await expireIfOverdue(order);
  return overdue.length;
}

/** Job harian: bukti bayar dihapus otomatis setelah 90 hari (PRD 10.6). */
export async function purgeOldPaymentProofs(): Promise<number> {
  const cutoff = new Date(Date.now() - PAYMENT_PROOF_RETENTION_DAYS * 86_400_000);
  const orders = await prisma.order.findMany({
    where: { paymentProofPath: { not: null }, paymentProofUploadedAt: { lt: cutoff } },
    select: { id: true, paymentProofPath: true },
    take: 500,
  });
  if (orders.length === 0) return 0;
  await removePrivateFiles(orders.flatMap((o) => (o.paymentProofPath ? [o.paymentProofPath] : [])));
  await prisma.order.updateMany({
    where: { id: { in: orders.map((o) => o.id) } },
    data: { paymentProofPath: null },
  });
  return orders.length;
}
