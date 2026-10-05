import type { OrderStatus, OrderType, PaymentMethod, StatusActor } from './enums';

export interface OrderKind {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: 'Menunggu Pembayaran',
  AWAITING_CONFIRMATION: 'Menunggu Konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  DELIVERING: 'Diantar',
  COMPLETED: 'Selesai',
  REJECTED: 'Ditolak',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DINE_IN: 'Makan di Tempat',
  DELIVERY: 'Diantar',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  QRIS: 'QRIS',
};

/** Status akhir: tidak bisa diubah lagi. */
export const FINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  'CONFIRMED',
  'COMPLETED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
];

/** Status yang dihitung sebagai penjualan berhasil di laporan. */
export const SUCCESSFUL_ORDER_STATUSES: readonly OrderStatus[] = ['CONFIRMED', 'COMPLETED'];

/** Pembeli hanya boleh membatalkan sebelum pemilik mengonfirmasi. */
export const CUSTOMER_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  'AWAITING_PAYMENT',
  'AWAITING_CONFIRMATION',
];

export const ADMIN_ORDER_TAB_KEYS = ['NEEDS_ACTION', 'ONGOING', 'DONE'] as const;
export type AdminOrderTab = (typeof ADMIN_ORDER_TAB_KEYS)[number];

export const ADMIN_ORDER_TABS: Record<AdminOrderTab, readonly OrderStatus[]> = {
  NEEDS_ACTION: ['AWAITING_CONFIRMATION'],
  ONGOING: ['AWAITING_PAYMENT', 'PROCESSING', 'DELIVERING'],
  DONE: ['COMPLETED', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
};

export const ADMIN_ORDER_TAB_LABELS: Record<AdminOrderTab, string> = {
  NEEDS_ACTION: 'Perlu Tindakan',
  ONGOING: 'Berjalan',
  DONE: 'Selesai',
};

interface Transition {
  from: OrderStatus;
  to: OrderStatus;
  actors: readonly StatusActor[];
  orderTypes?: readonly OrderType[];
  paymentMethods?: readonly PaymentMethod[];
}

// Satu-satunya sumber kebenaran untuk alur status (PRD Bagian 7).
const TRANSITIONS: readonly Transition[] = [
  { from: 'AWAITING_PAYMENT', to: 'AWAITING_CONFIRMATION', actors: ['CUSTOMER'], paymentMethods: ['QRIS'] },
  { from: 'AWAITING_PAYMENT', to: 'EXPIRED', actors: ['SYSTEM'] },
  { from: 'AWAITING_PAYMENT', to: 'CANCELLED', actors: ['CUSTOMER'] },
  { from: 'AWAITING_CONFIRMATION', to: 'CONFIRMED', actors: ['ADMIN'], orderTypes: ['DINE_IN'] },
  { from: 'AWAITING_CONFIRMATION', to: 'PROCESSING', actors: ['ADMIN'], orderTypes: ['DELIVERY'] },
  { from: 'AWAITING_CONFIRMATION', to: 'REJECTED', actors: ['ADMIN'] },
  { from: 'AWAITING_CONFIRMATION', to: 'CANCELLED', actors: ['CUSTOMER'] },
  { from: 'PROCESSING', to: 'DELIVERING', actors: ['ADMIN'], orderTypes: ['DELIVERY'] },
  { from: 'DELIVERING', to: 'COMPLETED', actors: ['ADMIN'], orderTypes: ['DELIVERY'] },
];

export function isFinalStatus(status: OrderStatus): boolean {
  return FINAL_ORDER_STATUSES.includes(status);
}

export function getInitialStatus(paymentMethod: PaymentMethod): OrderStatus {
  return paymentMethod === 'QRIS' ? 'AWAITING_PAYMENT' : 'AWAITING_CONFIRMATION';
}

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  actor: StatusActor,
  kind: OrderKind,
): boolean {
  return TRANSITIONS.some(
    (t) =>
      t.from === from &&
      t.to === to &&
      t.actors.includes(actor) &&
      (!t.orderTypes || t.orderTypes.includes(kind.orderType)) &&
      (!t.paymentMethods || t.paymentMethods.includes(kind.paymentMethod)),
  );
}

/** Urutan status "bahagia" untuk stepper progres di halaman pembeli. */
export function getStatusFlow(kind: OrderKind): OrderStatus[] {
  const flow: OrderStatus[] = [];
  if (kind.paymentMethod === 'QRIS') flow.push('AWAITING_PAYMENT');
  flow.push('AWAITING_CONFIRMATION');
  if (kind.orderType === 'DINE_IN') flow.push('CONFIRMED');
  else flow.push('PROCESSING', 'DELIVERING', 'COMPLETED');
  return flow;
}

/** Status tujuan saat pemilik menekan Konfirmasi / Terima. */
export function getConfirmTargetStatus(orderType: OrderType): OrderStatus {
  return orderType === 'DINE_IN' ? 'CONFIRMED' : 'PROCESSING';
}

/** Status tujuan saat pemilik menekan Antar Sekarang / Tandai Selesai. */
export function getAdvanceTargetStatus(status: OrderStatus): OrderStatus | null {
  if (status === 'PROCESSING') return 'DELIVERING';
  if (status === 'DELIVERING') return 'COMPLETED';
  return null;
}
