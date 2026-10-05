import type {
  AdminOrderDto,
  AdminOrderListItemDto,
  OptionSnapshot,
  OrderItemDto,
  OrderStatusLogDto,
  OrderSummaryDto,
  PublicOrderDto,
} from '@wtr/shared';
import type { OrderRow } from './services/orders';
import type { StoreSnapshot } from './services/store';

function toOrderItemDto(item: OrderRow['items'][number]): OrderItemDto {
  return {
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.nameSnapshot,
    basePrice: item.basePriceSnapshot,
    options: item.optionsSnapshot as unknown as OptionSnapshot[],
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  };
}

function toStatusLogDto(log: OrderRow['statusLogs'][number]): OrderStatusLogDto {
  return { status: log.toStatus, actor: log.actor, note: log.note, at: log.createdAt.toISOString() };
}

/** "Bakso Urat + 2 lainnya" */
export function summarizeItems(items: readonly { nameSnapshot: string; quantity: number }[]) {
  const first = items[0]?.nameSnapshot ?? '';
  return {
    itemSummary: items.length > 1 ? `${first} + ${items.length - 1} lainnya` : first,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function toPublicOrderDto(order: OrderRow, store: StoreSnapshot): PublicOrderDto {
  const awaitingQris = order.status === 'AWAITING_PAYMENT' && order.paymentMethod === 'QRIS';
  return {
    code: order.code,
    token: order.accessToken,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    landmark: order.landmark,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    paymentDeadline: order.paymentDeadline?.toISOString() ?? null,
    hasPaymentProof: order.paymentProofPath !== null,
    rejectionReason: order.rejectionReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(toOrderItemDto),
    statusLogs: order.statusLogs.map(toStatusLogDto),
    // QRIS terbaru dari pengaturan langsung dipakai pesanan berikutnya (PRD A-09).
    payment: awaitingQris
      ? { qrisImageUrl: store.settings.qrisImageUrl, qrisMerchantName: store.settings.qrisMerchantName }
      : null,
    store: {
      name: store.settings.name,
      address: store.settings.address,
      whatsapp: store.settings.whatsapp,
      logoUrl: store.settings.logoUrl,
    },
    serverTime: new Date().toISOString(),
  };
}

export function toOrderSummaryDto(order: OrderRow): OrderSummaryDto {
  return {
    token: order.accessToken,
    code: order.code,
    status: order.status,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    ...summarizeItems(order.items),
  };
}

export function toAdminOrderListItemDto(order: OrderRow): AdminOrderListItemDto {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    total: order.total,
    createdAt: order.createdAt.toISOString(),
    paymentDeadline: order.paymentDeadline?.toISOString() ?? null,
    hasPaymentProof: order.paymentProofPath !== null,
    ...summarizeItems(order.items),
  };
}

export function toAdminOrderDto(order: OrderRow): AdminOrderDto {
  return {
    id: order.id,
    code: order.code,
    token: order.accessToken,
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    landmark: order.landmark,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    paymentDeadline: order.paymentDeadline?.toISOString() ?? null,
    hasPaymentProof: order.paymentProofPath !== null,
    paymentProofUploadedAt: order.paymentProofUploadedAt?.toISOString() ?? null,
    rejectionReason: order.rejectionReason,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map(toOrderItemDto),
    statusLogs: order.statusLogs.map(toStatusLogDto),
    serverTime: new Date().toISOString(),
  };
}
