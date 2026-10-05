// Nilai enum di sini harus sama persis dengan enum di apps/api/prisma/schema.prisma.

export const ORDER_STATUSES = [
  'AWAITING_PAYMENT',
  'AWAITING_CONFIRMATION',
  'CONFIRMED',
  'PROCESSING',
  'DELIVERING',
  'COMPLETED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_TYPES = ['DINE_IN', 'DELIVERY'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const PAYMENT_METHODS = ['CASH', 'QRIS'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const STATUS_ACTORS = ['CUSTOMER', 'ADMIN', 'SYSTEM'] as const;
export type StatusActor = (typeof STATUS_ACTORS)[number];

export const OPTION_GROUP_TYPES = ['SINGLE', 'MULTIPLE'] as const;
export type OptionGroupType = (typeof OPTION_GROUP_TYPES)[number];

export const BANNER_TARGET_TYPES = ['NONE', 'CATEGORY', 'MENU'] as const;
export type BannerTargetType = (typeof BANNER_TARGET_TYPES)[number];

export const REJECTION_REASONS = [
  'Pembayaran tidak ditemukan',
  'Nominal tidak sesuai',
  'Menu habis',
  'Alamat di luar jangkauan',
  'Warung sudah tutup',
] as const;
