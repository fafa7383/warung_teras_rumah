import { z } from 'zod';
import { BANNER_TARGET_TYPES, OPTION_GROUP_TYPES } from './enums';
import { ADMIN_ORDER_TAB_KEYS } from './order-status';
import { phoneSchema } from './schemas';
import { TIME_REGEX, parseTime } from './store-hours';

// Skema form & request dashboard admin.

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const dateString = z.string().regex(DATE_REGEX, 'Format tanggal YYYY-MM-DD');
const imageUrl = z.url('URL gambar tidak valid');

export const adminOrdersQuerySchema = z.object({
  tab: z.enum(ADMIN_ORDER_TAB_KEYS).default('NEEDS_ACTION'),
  /** Filter tanggal (WIB) untuk tab Selesai. */
  date: dateString.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password lama wajib diisi'),
  newPassword: z.string().min(10, 'Password baru minimal 10 karakter').max(200),
});

export const optionInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, 'Nama opsi wajib diisi').max(40),
  priceDelta: z.number().int().min(0).max(1_000_000),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});
export type OptionInput = z.input<typeof optionInputSchema>;

export const optionGroupInputSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1, 'Nama grup wajib diisi').max(40),
    type: z.enum(OPTION_GROUP_TYPES),
    isRequired: z.boolean(),
    maxSelect: z.number().int().min(1).max(20).nullable(),
    options: z.array(optionInputSchema).min(1, 'Tambahkan minimal 1 opsi').max(20),
  })
  .superRefine((group, ctx) => {
    const defaults = group.options.filter((o) => o.isDefault).length;
    if (group.type === 'SINGLE' && defaults > 1) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Grup pilih satu hanya boleh 1 default' });
    }
    if (group.type === 'MULTIPLE' && group.maxSelect !== null && defaults > group.maxSelect) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'Default melebihi batas maksimal pilihan' });
    }
  });
export type OptionGroupInput = z.input<typeof optionGroupInputSchema>;

export const menuItemInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama menu wajib diisi').max(50, 'Nama maksimal 50 karakter'),
  categoryId: z.uuid('Pilih kategori dulu'),
  description: z.string().trim().max(120, 'Deskripsi maksimal 120 karakter').nullable(),
  basePrice: z.number('Harga wajib diisi').int().min(0).max(10_000_000),
  imageUrl: imageUrl.nullable(),
  isAvailable: z.boolean(),
  isFavorite: z.boolean(),
  isRecommended: z.boolean(),
  optionGroups: z.array(optionGroupInputSchema).max(10),
});
export type MenuItemInput = z.input<typeof menuItemInputSchema>;

export const availabilitySchema = z.object({ isAvailable: z.boolean() });

export const reorderSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(40),
  icon: z.string().trim().min(1).max(40),
  isActive: z.boolean(),
});
export type CategoryInput = z.input<typeof categoryInputSchema>;

export const bannerInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul wajib diisi').max(60),
    imageUrl,
    targetType: z.enum(BANNER_TARGET_TYPES),
    targetId: z.uuid().nullable(),
    isActive: z.boolean(),
  })
  .superRefine((banner, ctx) => {
    if (banner.targetType !== 'NONE' && !banner.targetId) {
      ctx.addIssue({ code: 'custom', path: ['targetId'], message: 'Pilih tujuan banner' });
    }
  });
export type BannerInput = z.input<typeof bannerInputSchema>;

export const storeSettingsInputSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama warung wajib diisi').max(60),
    address: z.string().trim().max(200),
    whatsapp: z.union([z.literal(''), phoneSchema]),
    logoUrl: imageUrl.nullable(),
    qrisImageUrl: imageUrl.nullable(),
    qrisMerchantName: z.string().trim().max(60).nullable(),
    soundRepeat: z.boolean(),
  })
  .partial();
export type StoreSettingsInput = z.input<typeof storeSettingsInputSchema>;

export const storeClosureSchema = z
  .object({
    isManuallyClosed: z.boolean(),
    /** NEXT_OPENING = sampai jam buka berikutnya; UNTIL = sampai waktu tertentu. */
    mode: z.enum(['NEXT_OPENING', 'UNTIL']).optional(),
    closedUntil: z.iso.datetime().nullable().optional(),
    closedMessage: z.string().trim().max(200).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isManuallyClosed && data.mode === 'UNTIL' && !data.closedUntil) {
      ctx.addIssue({ code: 'custom', path: ['closedUntil'], message: 'Pilih sampai jam berapa' });
    }
  });
export type StoreClosureInput = z.input<typeof storeClosureSchema>;

const operatingHourInput = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    openTime: z.string().regex(TIME_REGEX, 'Format jam HH:mm'),
    closeTime: z.string().regex(TIME_REGEX, 'Format jam HH:mm'),
  })
  .superRefine((hour, ctx) => {
    if (hour.isOpen && parseTime(hour.closeTime) <= parseTime(hour.openTime)) {
      ctx.addIssue({ code: 'custom', path: ['closeTime'], message: 'Jam tutup harus setelah jam buka' });
    }
  });

export const operatingHoursInputSchema = z.object({
  hours: z
    .array(operatingHourInput)
    .length(7)
    .refine((hours) => new Set(hours.map((h) => h.dayOfWeek)).size === 7, 'Jadwal harus 7 hari'),
});
export type OperatingHoursInput = z.input<typeof operatingHoursInputSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export const pushUnsubscribeSchema = z.object({ endpoint: z.url() });

export const reportQuerySchema = z
  .object({ from: dateString, to: dateString })
  .refine((q) => q.from <= q.to, { message: 'Tanggal awal harus sebelum tanggal akhir', path: ['from'] });

/** Template cepat grup opsi di form menu (PRD 8.4 & 11.1). */
export const OPTION_GROUP_TEMPLATES: Record<string, OptionGroupInput> = {
  'Level Pedas': {
    name: 'Level Pedas',
    type: 'SINGLE',
    isRequired: true,
    maxSelect: null,
    options: ['Tidak Pedas', 'Level 1', 'Level 2', 'Level 3', 'Level 4'].map((name) => ({
      name,
      priceDelta: 0,
      isDefault: name === 'Level 1',
      isActive: true,
    })),
  },
  Porsi: {
    name: 'Porsi',
    type: 'SINGLE',
    isRequired: true,
    maxSelect: null,
    options: [
      { name: 'Biasa', priceDelta: 0, isDefault: true, isActive: true },
      { name: 'Jumbo', priceDelta: 5000, isDefault: false, isActive: true },
    ],
  },
  Topping: {
    name: 'Topping',
    type: 'MULTIPLE',
    isRequired: false,
    maxSelect: 3,
    options: [
      ['Telur', 3000],
      ['Ceker', 4000],
      ['Sosis', 3000],
      ['Kerupuk', 2000],
      ['Bakso Tambahan', 4000],
    ].map(([name, priceDelta]) => ({
      name: String(name),
      priceDelta: Number(priceDelta),
      isDefault: false,
      isActive: true,
    })),
  },
  'Tingkat Manis': {
    name: 'Tingkat Manis',
    type: 'SINGLE',
    isRequired: true,
    maxSelect: null,
    options: ['Normal', 'Kurang Manis', 'Tanpa Gula'].map((name) => ({
      name,
      priceDelta: 0,
      isDefault: name === 'Normal',
      isActive: true,
    })),
  },
};

export const UPLOAD_KINDS = ['menu', 'banner', 'logo', 'qris'] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];
export const uploadQuerySchema = z.object({ kind: z.enum(UPLOAD_KINDS) });
