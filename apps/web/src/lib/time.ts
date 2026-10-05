import { formatDateTimeWIB, formatTimeWIB, toWibDateKey } from '@wtr/shared';

/** "baru saja", "3 menit lalu", "2 jam lalu", lalu tanggal lengkap WIB. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const diffMs = now - Date.parse(iso);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && toWibDateKey(new Date(iso)) === toWibDateKey(new Date(now))) return `${hours} jam lalu`;
  if (toWibDateKey(new Date(iso)) === toWibDateKey(new Date(now - 86_400_000))) return `kemarin ${formatTimeWIB(iso)}`;
  return formatDateTimeWIB(iso);
}

export function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Tanggal hari ini (WIB) "YYYY-MM-DD". */
export const todayKey = () => toWibDateKey(new Date());
