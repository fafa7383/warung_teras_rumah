import { computeStoreStatus, type StoreDto } from '@wtr/shared';
import { HttpError } from '../lib/http-error';
import { prisma } from '../lib/prisma';

export async function getStoreSettingsRow() {
  const settings = await prisma.storeSetting.findUnique({ where: { id: 1 } });
  if (!settings) {
    throw new HttpError(500, 'STORE_NOT_SEEDED', 'Pengaturan warung belum ada. Jalankan pnpm db:seed.');
  }
  return settings;
}

export function getOperatingHours() {
  return prisma.operatingHour.findMany({ orderBy: { dayOfWeek: 'asc' } });
}

export async function getStoreSnapshot(now: Date = new Date()) {
  const [settings, hours] = await Promise.all([getStoreSettingsRow(), getOperatingHours()]);
  const status = computeStoreStatus({
    hours,
    isManuallyClosed: settings.isManuallyClosed,
    closedUntil: settings.closedUntil,
    closedMessage: settings.closedMessage,
    now,
  });
  return { settings, hours, status, now };
}

export type StoreSnapshot = Awaited<ReturnType<typeof getStoreSnapshot>>;

export function toStoreDto({ settings, hours, status, now }: StoreSnapshot): StoreDto {
  return {
    name: settings.name,
    address: settings.address,
    whatsapp: settings.whatsapp,
    logoUrl: settings.logoUrl,
    hours: hours.map(({ dayOfWeek, isOpen, openTime, closeTime }) => ({ dayOfWeek, isOpen, openTime, closeTime })),
    status,
    serverTime: now.toISOString(),
  };
}

/** Dipanggil ulang saat POST /orders (PRD 10.6). */
export async function assertStoreOpen() {
  const { status } = await getStoreSnapshot();
  if (status.isOpen) return;
  const when = status.nextOpenLabel ? ` Buka lagi ${status.nextOpenLabel}.` : '';
  throw new HttpError(409, 'STORE_CLOSED', `Warung lagi tutup, Kak.${when}`);
}
