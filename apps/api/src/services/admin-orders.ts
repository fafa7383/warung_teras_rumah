import {
  ADMIN_ORDER_TABS,
  SUCCESSFUL_ORDER_STATUSES,
  addDaysToDateKey,
  toWibDateKey,
  wibDayStart,
  type AdminOrderTab,
  type AdminOrdersResponse,
} from '@wtr/shared';
import { prisma } from '../lib/prisma';
import { toAdminOrderListItemDto } from '../serializers';
import { expireOverdueOrders, orderInclude } from './orders';

function dayRange(dateKey: string) {
  return { gte: wibDayStart(dateKey), lt: wibDayStart(addDaysToDateKey(dateKey, 1)) };
}

/** Daftar pesanan per tab + ringkasan hari ini (PRD 8.2). */
export async function listAdminOrders(tab: AdminOrderTab, date?: string): Promise<AdminOrdersResponse> {
  // Pastikan pesanan QRIS yang lewat batas waktu tidak tampil di tab Berjalan.
  await expireOverdueOrders();

  const today = toWibDateKey(new Date());
  const isDone = tab === 'DONE';

  const [orders, ordersToday, revenueToday, needsAction] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { in: [...ADMIN_ORDER_TABS[tab]] },
        ...(isDone ? { createdAt: dayRange(date ?? today) } : {}),
      },
      include: orderInclude,
      // Antrean tindakan: yang paling lama menunggu di atas.
      orderBy: { createdAt: isDone ? 'desc' : 'asc' },
      take: 200,
    }),
    prisma.order.count({
      where: { createdAt: dayRange(today), status: { notIn: ['EXPIRED', 'CANCELLED'] } },
    }),
    prisma.order.aggregate({
      where: { createdAt: dayRange(today), status: { in: [...SUCCESSFUL_ORDER_STATUSES] } },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { status: 'AWAITING_CONFIRMATION' } }),
  ]);

  return {
    tab,
    orders: orders.map(toAdminOrderListItemDto),
    summary: { ordersToday, revenueToday: revenueToday._sum.total ?? 0, needsAction },
    serverTime: new Date().toISOString(),
  };
}
