import { z } from 'zod';
import {
  LOCAL_HISTORY_MAX,
  MAX_ITEM_QTY,
  MAX_ORDER_LINES,
  MIN_ITEM_QTY,
  ORDER_CODE_REGEX,
} from './constants';
import { ORDER_TYPES, PAYMENT_METHODS, type OrderType } from './enums';
import { normalizePhone } from './format';

// Skema yang sama dipakai React Hook Form (web) dan validasi request (api).

export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Nomor WhatsApp wajib diisi')
  .refine((v) => normalizePhone(v) !== null, 'Nomor WA diawali 08 atau 62, 10–14 digit')
  .transform((v) => normalizePhone(v) ?? v);

export const customerNameSchema = z
  .string()
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(50, 'Nama maksimal 50 karakter');

export const cartLineSchema = z.object({
  menuItemId: z.uuid(),
  optionIds: z.array(z.uuid()).max(30).default([]),
  quantity: z.number().int().min(MIN_ITEM_QTY).max(MAX_ITEM_QTY),
});
export type CartLineInput = z.input<typeof cartLineSchema>;
export type CartLinePayload = z.output<typeof cartLineSchema>;

export const cartValidateSchema = z.object({
  items: z.array(cartLineSchema).min(1).max(MAX_ORDER_LINES),
});

const checkoutFields = z.object({
  orderType: z.enum(ORDER_TYPES, 'Pilih cara pesan dulu ya'),
  paymentMethod: z.enum(PAYMENT_METHODS, 'Pilih metode pembayaran dulu ya'),
  customerName: customerNameSchema,
  customerPhone: phoneSchema,
  address: z.string().trim().max(200, 'Alamat maksimal 200 karakter').optional(),
  landmark: z.string().trim().max(100, 'Patokan maksimal 100 karakter').optional(),
});

interface IssueSink {
  addIssue(issue: { code: 'custom'; path: string[]; message: string }): void;
}

/** Alamat & patokan hanya wajib untuk pesanan diantar. */
function requireDeliveryAddress(
  data: { orderType: OrderType; address?: string; landmark?: string },
  ctx: IssueSink,
) {
  if (data.orderType !== 'DELIVERY') return;
  if (!data.address || data.address.length < 10) {
    ctx.addIssue({ code: 'custom', path: ['address'], message: 'Alamat minimal 10 karakter' });
  }
  if (!data.landmark) {
    ctx.addIssue({ code: 'custom', path: ['landmark'], message: 'Patokan wajib diisi' });
  }
}

/** Isian form checkout di halaman Keranjang. */
export const checkoutFormSchema = checkoutFields.superRefine((data, ctx) =>
  requireDeliveryAddress(data, ctx),
);
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormValues = z.output<typeof checkoutFormSchema>;

export const createOrderSchema = checkoutFields
  .extend({
    items: z
      .array(cartLineSchema)
      .min(1, 'Keranjangmu masih kosong')
      .max(MAX_ORDER_LINES, `Maksimal ${MAX_ORDER_LINES} baris item`),
    turnstileToken: z.string().min(1, 'Selesaikan captcha dulu ya'),
    /** Total yang dilihat pembeli; bila beda dengan hitungan server, pesanan ditolak dengan PRICE_CHANGED. */
    expectedTotal: z.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => requireDeliveryAddress(data, ctx));
export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type CreateOrderPayload = z.output<typeof createOrderSchema>;

export const orderLookupSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(ORDER_CODE_REGEX, 'Format kode pesanan: WTR-XXXXX'),
  customerPhone: phoneSchema,
  turnstileToken: z.string().min(1, 'Selesaikan captcha dulu ya'),
});
export type OrderLookupInput = z.input<typeof orderLookupSchema>;

export const orderStatusBatchSchema = z.object({
  tokens: z.array(z.string().min(16).max(64)).min(1).max(LOCAL_HISTORY_MAX),
});

export const rejectOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Pilih atau tulis alasan penolakan').max(200),
});

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi').max(50),
  password: z.string().min(1, 'Password wajib diisi').max(200),
  rememberMe: z.boolean().default(false),
});
export type AdminLoginInput = z.input<typeof adminLoginSchema>;
