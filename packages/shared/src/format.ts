import { STORE_TIMEZONE } from './constants';

const rupiahNumber = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** 15000 → "Rp15.000" (titik ribuan, tanpa spasi). */
export function formatRupiah(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}Rp${rupiahNumber.format(Math.abs(amount))}`;
}

/** 5000 → "+Rp5.000"; 0 → "" (opsi gratis tidak menampilkan harga). */
export function formatPriceDelta(delta: number): string {
  return delta > 0 ? `+${formatRupiah(delta)}` : '';
}

// Nama bulan ditulis manual agar hasilnya tidak bergantung versi data locale (CLDR) di browser.
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const jakartaFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface JakartaDateParts {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 0 = Minggu … 6 = Sabtu (sama dengan operating_hours.day_of_week). */
  dayOfWeek: number;
}

export function getJakartaParts(input: Date | string | number): JakartaDateParts {
  const parts = jakartaFormatter.formatToParts(new Date(input));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    dayOfWeek: WEEKDAYS_EN.indexOf(get('weekday')),
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "14.30" (WIB) */
export function formatTimeWIB(input: Date | string | number): string {
  const p = getJakartaParts(input);
  return `${pad2(p.hour)}.${pad2(p.minute)}`;
}

/** "5 Okt 2026" (WIB) */
export function formatDateWIB(input: Date | string | number): string {
  const p = getJakartaParts(input);
  return `${p.day} ${MONTHS_SHORT[p.month - 1]} ${p.year}`;
}

/** "5 Okt 2026, 14.30" (WIB) */
export function formatDateTimeWIB(input: Date | string | number): string {
  return `${formatDateWIB(input)}, ${formatTimeWIB(input)}`;
}

/**
 * Nomor WA → format 62… . Menerima "0812-3456-7890", "+62 812 3456 7890", dll.
 * Mengembalikan null bila tidak diawali 08/628 atau panjangnya di luar 10–14 digit.
 */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().+]/g, '');
  if (!/^\d{10,14}$/.test(digits)) return null;
  if (digits.startsWith('08')) return `62${digits.slice(1)}`;
  if (digits.startsWith('628')) return digits;
  return null;
}

/** 6281234567890 → "0812-3456-7890" untuk ditampilkan. */
export function formatPhoneDisplay(phone62: string): string {
  const local = phone62.startsWith('62') ? `0${phone62.slice(2)}` : phone62;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, '$1-$2-$3');
}

export function buildWhatsAppUrl(phone62: string, text?: string): string {
  const base = `https://wa.me/${phone62}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
