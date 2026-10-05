import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  SUCCESSFUL_ORDER_STATUSES,
  addDaysToDateKey,
  formatDateTimeWIB,
  toWibDateKey,
  wibDayStart,
  type ReportResponse,
} from '@wtr/shared';
import { prisma } from '../lib/prisma';
import { summarizeItems } from '../serializers';

const MAX_RANGE_DAYS = 366;

function periodRange(from: string, to: string) {
  return { gte: wibDayStart(from), lt: wibDayStart(addDaysToDateKey(to, 1)) };
}

/** Laporan hanya menghitung pesanan berhasil: Selesai (delivery) dan Dikonfirmasi (dine-in). */
export async function buildReport(from: string, to: string): Promise<ReportResponse> {
  const orders = await prisma.order.findMany({
    where: { status: { in: [...SUCCESSFUL_ORDER_STATUSES] }, createdAt: periodRange(from, to) },
    select: {
      total: true,
      paymentMethod: true,
      orderType: true,
      createdAt: true,
      items: { select: { menuItemId: true, nameSnapshot: true, quantity: true, lineTotal: true } },
    },
  });

  const report: ReportResponse = {
    from,
    to,
    orderCount: orders.length,
    revenue: 0,
    averageOrderValue: 0,
    byPaymentMethod: { CASH: { count: 0, revenue: 0 }, QRIS: { count: 0, revenue: 0 } },
    byOrderType: { DINE_IN: { count: 0, revenue: 0 }, DELIVERY: { count: 0, revenue: 0 } },
    daily: [],
    topItems: [],
  };

  const daily = new Map<string, { count: number; revenue: number }>();
  for (let key = from, i = 0; key <= to && i < MAX_RANGE_DAYS; key = addDaysToDateKey(key, 1), i++) {
    daily.set(key, { count: 0, revenue: 0 });
  }
  const items = new Map<string, { menuItemId: string; name: string; quantity: number; revenue: number }>();

  for (const order of orders) {
    report.revenue += order.total;
    report.byPaymentMethod[order.paymentMethod].count++;
    report.byPaymentMethod[order.paymentMethod].revenue += order.total;
    report.byOrderType[order.orderType].count++;
    report.byOrderType[order.orderType].revenue += order.total;

    const day = daily.get(toWibDateKey(order.createdAt));
    if (day) {
      day.count++;
      day.revenue += order.total;
    }
    for (const item of order.items) {
      const entry = items.get(item.menuItemId) ?? {
        menuItemId: item.menuItemId,
        name: item.nameSnapshot,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += item.quantity;
      entry.revenue += item.lineTotal;
      items.set(item.menuItemId, entry);
    }
  }

  report.averageOrderValue = orders.length > 0 ? Math.round(report.revenue / orders.length) : 0;
  report.daily = [...daily].map(([date, value]) => ({ date, ...value }));
  report.topItems = [...items.values()]
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5);
  return report;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Unduh CSV (P1): satu baris per pesanan berhasil. */
export async function buildReportCsv(from: string, to: string): Promise<string> {
  const orders = await prisma.order.findMany({
    where: { status: { in: [...SUCCESSFUL_ORDER_STATUSES] }, createdAt: periodRange(from, to) },
    orderBy: { createdAt: 'asc' },
    select: {
      code: true,
      createdAt: true,
      orderType: true,
      paymentMethod: true,
      status: true,
      customerName: true,
      total: true,
      items: { orderBy: { sortOrder: 'asc' }, select: { nameSnapshot: true, quantity: true } },
    },
  });

  const header = ['Kode', 'Waktu (WIB)', 'Cara Pesan', 'Pembayaran', 'Status', 'Nama', 'Jumlah Item', 'Item', 'Total'];
  const rows = orders.map((order) => {
    const { itemCount } = summarizeItems(order.items);
    return [
      order.code,
      formatDateTimeWIB(order.createdAt),
      ORDER_TYPE_LABELS[order.orderType],
      PAYMENT_METHOD_LABELS[order.paymentMethod],
      ORDER_STATUS_LABELS[order.status],
      order.customerName,
      itemCount,
      order.items.map((item) => `${item.quantity}x ${item.nameSnapshot}`).join(', '),
      order.total,
    ];
  });
  // BOM agar Excel membaca UTF-8 dengan benar.
  return `﻿${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}
