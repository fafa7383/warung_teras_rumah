import { describe, expect, it } from 'vitest';
import {
  addDaysToDateKey,
  computeStoreStatus,
  nextOpeningAfterCurrent,
  toWibDateKey,
  wibDayStart,
  type OperatingHourLike,
} from './store-hours';

const everyDay: OperatingHourLike[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  dayOfWeek,
  isOpen: true,
  openTime: '10:00',
  closeTime: '21:00',
}));

const base = { hours: everyDay, isManuallyClosed: false, closedUntil: null, closedMessage: null };

describe('computeStoreStatus', () => {
  it('buka di dalam jam operasional', () => {
    // Senin 5 Okt 2026, 14.30 WIB
    const status = computeStoreStatus({ ...base, now: new Date('2026-10-05T07:30:00Z') });
    expect(status).toMatchObject({ isOpen: true, reason: 'OPEN', closesAt: '21.00' });
  });

  it('tutup malam hari, buka lagi besok', () => {
    const status = computeStoreStatus({ ...base, now: new Date('2026-10-05T15:00:00Z') }); // 22.00
    expect(status).toMatchObject({ isOpen: false, reason: 'OUTSIDE_HOURS', nextOpenLabel: 'besok 10.00' });
    expect(status.nextOpenAt).toBe('2026-10-06T03:00:00.000Z');
  });

  it('pagi sebelum buka: buka hari ini', () => {
    const status = computeStoreStatus({ ...base, now: new Date('2026-10-05T01:00:00Z') }); // 08.00
    expect(status.nextOpenLabel).toBe('hari ini 10.00');
  });

  it('melewati hari libur dan menulis nama hari', () => {
    const sundayOff = everyDay.map((h) => (h.dayOfWeek === 0 ? { ...h, isOpen: false } : h));
    // Sabtu 10 Okt 2026, 22.00 WIB → Minggu libur → Senin 10.00
    const status = computeStoreStatus({ ...base, hours: sundayOff, now: new Date('2026-10-10T15:00:00Z') });
    expect(status.nextOpenLabel).toBe('Senin 10.00');
  });

  it('tutup manual sampai jam tertentu', () => {
    const status = computeStoreStatus({
      ...base,
      isManuallyClosed: true,
      closedUntil: '2026-10-05T10:00:00Z', // 17.00 WIB
      closedMessage: 'Lagi belanja bahan dulu',
      now: new Date('2026-10-05T07:30:00Z'),
    });
    expect(status).toMatchObject({
      isOpen: false,
      reason: 'MANUAL',
      nextOpenLabel: 'hari ini 17.00',
      message: 'Lagi belanja bahan dulu',
    });
  });

  it('tutup manual yang sudah lewat waktunya dianggap buka', () => {
    const status = computeStoreStatus({
      ...base,
      isManuallyClosed: true,
      closedUntil: '2026-10-05T05:00:00Z',
      now: new Date('2026-10-05T07:30:00Z'),
    });
    expect(status.isOpen).toBe(true);
  });

  it('tutup manual tanpa batas waktu', () => {
    const status = computeStoreStatus({
      ...base,
      isManuallyClosed: true,
      now: new Date('2026-10-05T07:30:00Z'),
    });
    expect(status).toMatchObject({ isOpen: false, reason: 'MANUAL', nextOpenLabel: null });
  });
});

describe('tanggal WIB untuk laporan', () => {
  it('memotong hari di 00.00 WIB', () => {
    expect(toWibDateKey(new Date('2026-10-04T18:00:00Z'))).toBe('2026-10-05');
    expect(toWibDateKey(new Date('2026-10-05T16:59:59Z'))).toBe('2026-10-05');
    expect(toWibDateKey(new Date('2026-10-05T17:00:00Z'))).toBe('2026-10-06');
    expect(wibDayStart('2026-10-05').toISOString()).toBe('2026-10-04T17:00:00.000Z');
  });

  it('menambah hari melewati akhir bulan/tahun', () => {
    expect(addDaysToDateKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDateKey('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('nextOpeningAfterCurrent', () => {
  it('saat buka, mengambil jam buka hari berikutnya', () => {
    expect(nextOpeningAfterCurrent(everyDay, new Date('2026-10-05T07:30:00Z'))?.toISOString()).toBe(
      '2026-10-06T03:00:00.000Z',
    );
  });

  it('saat tutup, mengambil jam buka terdekat', () => {
    expect(nextOpeningAfterCurrent(everyDay, new Date('2026-10-05T01:00:00Z'))?.toISOString()).toBe(
      '2026-10-05T03:00:00.000Z',
    );
  });
});
