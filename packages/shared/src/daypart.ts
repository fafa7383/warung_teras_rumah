import { WIB_OFFSET_MS } from './store-hours';

/** Suasana header Home: pagi 06.00–14.00, sore 14.00–18.00, malam 18.00–06.00 WIB. */
export type Daypart = 'morning' | 'afternoon' | 'night';

/** Jam mulai tiap suasana (WIB). */
export const DAYPART_START_HOUR = { morning: 6, afternoon: 14, night: 18 } as const;

const DAY_MS = 86_400_000;

/** Jam WIB berpecahan: 17.30 → 17.5. */
export function getWibHour(date: Date = new Date()): number {
  const msIntoDay = (((date.getTime() + WIB_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS;
  return msIntoDay / 3_600_000;
}

export function daypartFromHour(hour: number): Daypart {
  if (hour >= DAYPART_START_HOUR.morning && hour < DAYPART_START_HOUR.afternoon) return 'morning';
  if (hour >= DAYPART_START_HOUR.afternoon && hour < DAYPART_START_HOUR.night) return 'afternoon';
  return 'night';
}

export function getDaypart(date: Date = new Date()): Daypart {
  return daypartFromHour(getWibHour(date));
}
