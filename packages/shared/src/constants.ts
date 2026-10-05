export const STORE_TIMEZONE = 'Asia/Jakarta';

/** Kode pesanan: `WTR-` + 5 karakter tanpa huruf/angka yang membingungkan (0, O, 1, I). */
export const ORDER_CODE_PREFIX = 'WTR-';
export const ORDER_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ORDER_CODE_LENGTH = 5;
export const ORDER_CODE_REGEX = new RegExp(
  `^${ORDER_CODE_PREFIX}[${ORDER_CODE_ALPHABET}]{${ORDER_CODE_LENGTH}}$`,
);
export const ORDER_ACCESS_TOKEN_BYTES = 24;

export const QRIS_PAYMENT_WINDOW_MS = 10 * 60 * 1000;
export const PAYMENT_PROOF_GRACE_MS = 30 * 1000;
export const PAYMENT_PROOF_RETENTION_DAYS = 90;

export const MIN_ITEM_QTY = 1;
export const MAX_ITEM_QTY = 20;
export const MAX_ORDER_LINES = 30;
export const DELIVERY_FEE = 0;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_ACTIVE_BANNERS = 5;
export const LOCAL_HISTORY_MAX = 30;

export const CUSTOMER_STATUS_POLL_MS = 10_000;
export const ADMIN_ORDERS_POLL_MS = 15_000;
