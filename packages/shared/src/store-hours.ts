import { DAY_NAMES_ID, formatTimeWIB } from './format';

// WIB tidak mengenal daylight saving, jadi selisihnya tetap UTC+7. Ini membuat hitungan tanggal
// "hari ini/besok" cukup dengan aritmetika biasa tanpa library zona waktu.
export const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface OperatingHourLike {
  /** 0 = Minggu … 6 = Sabtu */
  dayOfWeek: number;
  isOpen: boolean;
  /** "HH:mm" WIB */
  openTime: string;
  closeTime: string;
}

export interface StoreStatus {
  isOpen: boolean;
  reason: 'OPEN' | 'OUTSIDE_HOURS' | 'MANUAL';
  /** "21.00" saat sedang buka. */
  closesAt: string | null;
  /** ISO waktu buka berikutnya saat sedang tutup. */
  nextOpenAt: string | null;
  /** "hari ini 10.00", "besok 10.00", atau "Senin 10.00". */
  nextOpenLabel: string | null;
  /** Pesan dari pemilik saat tutup manual. */
  message: string | null;
}

export interface StoreStatusInput {
  hours: readonly OperatingHourLike[];
  isManuallyClosed: boolean;
  closedUntil: Date | string | null;
  closedMessage: string | null;
  now?: Date;
}

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "10:00" → 600 (menit sejak tengah malam). */
export function parseTime(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** "10:00" → "10.00" (gaya penulisan jam Indonesia). */
export function formatClock(time: string): string {
  return time.replace(':', '.');
}

function jakartaCalendar(date: Date) {
  const shifted = new Date(date.getTime() + WIB_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    dayOfWeek: shifted.getUTCDay(),
  };
}

function atJakarta(year: number, month: number, day: number, minutes: number): Date {
  return new Date(Date.UTC(year, month, day, 0, minutes) - WIB_OFFSET_MS);
}

/**
 * Jendela buka pertama yang belum lewat sejak `from`.
 * `at` = `from` bila `from` sudah di dalam jam buka, selain itu jam buka berikutnya.
 */
export function findNextOpening(
  hours: readonly OperatingHourLike[],
  from: Date,
): { at: Date; closeAt: Date } | null {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]));
  const base = jakartaCalendar(from);

  for (let offset = 0; offset <= 7; offset++) {
    const schedule = byDay.get((base.dayOfWeek + offset) % 7);
    if (!schedule?.isOpen) continue;
    const openAt = atJakarta(base.year, base.month, base.day + offset, parseTime(schedule.openTime));
    const closeAt = atJakarta(base.year, base.month, base.day + offset, parseTime(schedule.closeTime));
    if (closeAt <= openAt || closeAt <= from) continue;
    return { at: from > openAt ? from : openAt, closeAt };
  }
  return null;
}

/** "hari ini 10.00", "besok 10.00", atau nama hari untuk yang lebih jauh. */
export function relativeDayLabel(target: Date, now: Date): string {
  const a = jakartaCalendar(now);
  const b = jakartaCalendar(target);
  const dayDiff = Math.round(
    (Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day)) / 86_400_000,
  );
  const time = formatTimeWIB(target);
  if (dayDiff === 0) return `hari ini ${time}`;
  if (dayDiff === 1) return `besok ${time}`;
  return `${DAY_NAMES_ID[b.dayOfWeek]} ${time}`;
}

export function computeStoreStatus(input: StoreStatusInput): StoreStatus {
  const now = input.now ?? new Date();
  const closedUntil = input.closedUntil ? new Date(input.closedUntil) : null;
  const manual = input.isManuallyClosed && (!closedUntil || closedUntil > now);

  const current = findNextOpening(input.hours, now);
  const withinHours = current !== null && current.at.getTime() === now.getTime();

  if (!manual && withinHours) {
    return {
      isOpen: true,
      reason: 'OPEN',
      closesAt: formatTimeWIB(current.closeAt),
      nextOpenAt: null,
      nextOpenLabel: null,
      message: null,
    };
  }

  // Tutup manual tanpa batas waktu: tidak ada perkiraan jam buka.
  const searchFrom = manual ? closedUntil : now;
  const next = searchFrom ? findNextOpening(input.hours, searchFrom) : null;
  return {
    isOpen: false,
    reason: manual ? 'MANUAL' : 'OUTSIDE_HOURS',
    closesAt: null,
    nextOpenAt: next?.at.toISOString() ?? null,
    nextOpenLabel: next ? relativeDayLabel(next.at, now) : null,
    message: manual ? (input.closedMessage ?? null) : null,
  };
}

/** Untuk pilihan "tutup sampai jam buka berikutnya": jendela buka setelah jendela yang sedang berjalan. */
export function nextOpeningAfterCurrent(
  hours: readonly OperatingHourLike[],
  now: Date = new Date(),
): Date | null {
  const current = findNextOpening(hours, now);
  if (!current) return null;
  if (current.at.getTime() !== now.getTime()) return current.at;
  return findNextOpening(hours, current.closeAt)?.at ?? null;
}

/** Tanggal WIB "YYYY-MM-DD" dari sebuah waktu. */
export function toWibDateKey(date: Date): string {
  return new Date(date.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** Awal hari (00.00 WIB) dari tanggal "YYYY-MM-DD", sebagai Date UTC. */
export function wibDayStart(dateKey: string): Date {
  return new Date(new Date(`${dateKey}T00:00:00.000Z`).getTime() - WIB_OFFSET_MS);
}

/** "2026-10-05" + 1 → "2026-10-06" */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getTodayHours(
  hours: readonly OperatingHourLike[],
  now: Date = new Date(),
): OperatingHourLike | null {
  const { dayOfWeek } = jakartaCalendar(now);
  return hours.find((h) => h.dayOfWeek === dayOfWeek) ?? null;
}
