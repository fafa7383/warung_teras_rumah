import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppUrl,
  formatDateTimeWIB,
  formatPhoneDisplay,
  formatPriceDelta,
  formatRupiah,
  getJakartaParts,
  normalizePhone,
} from './format';
import { createOrderSchema, orderLookupSchema } from './schemas';

describe('format uang', () => {
  it('menulis harga "Rp15.000" tanpa spasi', () => {
    expect(formatRupiah(15000)).toBe('Rp15.000');
    expect(formatRupiah(1250000)).toBe('Rp1.250.000');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatPriceDelta(5000)).toBe('+Rp5.000');
    expect(formatPriceDelta(0)).toBe('');
  });
});

describe('format waktu WIB', () => {
  it('menampilkan "5 Okt 2026, 14.30" dari waktu UTC', () => {
    expect(formatDateTimeWIB('2026-10-05T07:30:00Z')).toBe('5 Okt 2026, 14.30');
  });

  it('menangani pergantian hari di zona Asia/Jakarta', () => {
    expect(formatDateTimeWIB('2026-12-31T17:05:00Z')).toBe('1 Jan 2027, 00.05');
  });

  it('hari dalam minggu memakai 0 = Minggu', () => {
    expect(getJakartaParts('2026-10-05T07:30:00Z').dayOfWeek).toBe(1); // Senin
    expect(getJakartaParts('2026-10-04T18:00:00Z').dayOfWeek).toBe(1); // Senin 01.00 WIB
  });
});

describe('nomor WhatsApp', () => {
  it('menormalkan ke format 62…', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('6281234567890');
    expect(normalizePhone('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizePhone('6281234567890')).toBe('6281234567890');
  });

  it('menolak nomor yang tidak valid', () => {
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone('0712345678')).toBeNull();
    expect(normalizePhone('081234567')).toBeNull();
    expect(normalizePhone('628123456789012')).toBeNull();
    expect(normalizePhone('0812abc45678')).toBeNull();
  });

  it('format tampilan dan link wa.me', () => {
    expect(formatPhoneDisplay('6281234567890')).toBe('0812-3456-7890');
    expect(buildWhatsAppUrl('6281234567890', 'Halo Kak')).toBe(
      'https://wa.me/6281234567890?text=Halo%20Kak',
    );
  });
});

describe('skema checkout', () => {
  const base = {
    items: [{ menuItemId: '7c9e6679-7425-40de-944b-e07fc1f90ae7', quantity: 1 }],
    paymentMethod: 'CASH',
    customerName: 'Budi',
    customerPhone: '0812-3456-7890',
    turnstileToken: 'token',
  } as const;

  it('dine-in cukup nama dan WA; nomor dinormalkan', () => {
    const result = createOrderSchema.safeParse({ ...base, orderType: 'DINE_IN' });
    expect(result.success).toBe(true);
    expect(result.data?.customerPhone).toBe('6281234567890');
    expect(result.data?.items[0]?.optionIds).toEqual([]);
  });

  it('delivery wajib alamat dan patokan', () => {
    const result = createOrderSchema.safeParse({ ...base, orderType: 'DELIVERY' });
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['address', 'landmark']));
  });

  it('cek pesanan menerima kode huruf kecil', () => {
    const result = orderLookupSchema.safeParse({
      code: ' wtr-7k2q9 ',
      customerPhone: '081234567890',
      turnstileToken: 'token',
    });
    expect(result.success).toBe(true);
    expect(result.data?.code).toBe('WTR-7K2Q9');
  });
});
