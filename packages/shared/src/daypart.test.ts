import { describe, expect, it } from 'vitest';
import { daypartFromHour, getDaypart, getWibHour } from './daypart';

const wib = (time: string) => new Date(`2026-10-07T${time}:00+07:00`);

describe('getWibHour', () => {
  it('mengubah waktu ke jam WIB berpecahan', () => {
    expect(getWibHour(wib('17:30'))).toBe(17.5);
    expect(getWibHour(wib('00:00'))).toBe(0);
  });

  it('memakai WIB walau waktunya ditulis dalam UTC', () => {
    // 23.00 UTC = 06.00 WIB hari berikutnya.
    expect(getWibHour(new Date('2026-10-07T23:00:00Z'))).toBe(6);
  });
});

describe('getDaypart', () => {
  it.each([
    ['00:00', 'night'],
    ['05:59', 'night'],
    ['06:00', 'morning'],
    ['13:59', 'morning'],
    ['14:00', 'afternoon'],
    ['17:59', 'afternoon'],
    ['18:00', 'night'],
    ['23:59', 'night'],
  ] as const)('%s WIB → %s', (time, expected) => {
    expect(getDaypart(wib(time))).toBe(expected);
  });
});

describe('daypartFromHour', () => {
  it('menerima jam berpecahan', () => {
    expect(daypartFromHour(13.99)).toBe('morning');
    expect(daypartFromHour(17.5)).toBe('afternoon');
  });
});
