import {
  nextOpeningAfterCurrent,
  operatingHoursInputSchema,
  storeClosureSchema,
  storeSettingsInputSchema,
  type AdminSettingsDto,
} from '@wtr/shared';
import { Router } from 'express';
import { HttpError } from '../../lib/http-error';
import { prisma } from '../../lib/prisma';
import { isWhatsAppGatewayEnabled } from '../../lib/whatsapp-gateway';
import { getStoreSnapshot } from '../../services/store';

export const settingsRouter = Router();

async function loadSettingsDto(): Promise<AdminSettingsDto> {
  const { settings, hours, status } = await getStoreSnapshot();
  return {
    name: settings.name,
    address: settings.address,
    whatsapp: settings.whatsapp,
    logoUrl: settings.logoUrl,
    qrisImageUrl: settings.qrisImageUrl,
    qrisMerchantName: settings.qrisMerchantName,
    isManuallyClosed: settings.isManuallyClosed,
    closedUntil: settings.closedUntil?.toISOString() ?? null,
    closedMessage: settings.closedMessage,
    soundRepeat: settings.soundRepeat,
    hours: hours.map(({ dayOfWeek, isOpen, openTime, closeTime }) => ({ dayOfWeek, isOpen, openTime, closeTime })),
    status,
    waGatewayEnabled: isWhatsAppGatewayEnabled(),
  };
}

settingsRouter.get('/settings', async (_req, res) => {
  res.json(await loadSettingsDto());
});

settingsRouter.patch('/settings', async (req, res) => {
  const input = storeSettingsInputSchema.parse(req.body);
  await prisma.storeSetting.update({ where: { id: 1 }, data: input });
  res.json(await loadSettingsDto());
});

/** Switch "Terima Pesanan" di halaman Pesanan (PRD 8.2, A-08). */
settingsRouter.post('/settings/closure', async (req, res) => {
  const input = storeClosureSchema.parse(req.body);

  if (!input.isManuallyClosed) {
    await prisma.storeSetting.update({
      where: { id: 1 },
      data: { isManuallyClosed: false, closedUntil: null, closedMessage: null },
    });
    res.json(await loadSettingsDto());
    return;
  }

  let closedUntil: Date | null = null;
  if (input.mode === 'UNTIL' && input.closedUntil) {
    closedUntil = new Date(input.closedUntil);
    if (closedUntil.getTime() <= Date.now()) {
      throw new HttpError(400, 'INVALID_TIME', 'Pilih waktu yang belum lewat');
    }
  } else if (input.mode === 'NEXT_OPENING') {
    const hours = await prisma.operatingHour.findMany();
    closedUntil = nextOpeningAfterCurrent(hours);
  }

  await prisma.storeSetting.update({
    where: { id: 1 },
    data: { isManuallyClosed: true, closedUntil, closedMessage: input.closedMessage || null },
  });
  res.json(await loadSettingsDto());
});

/** Jam operasional per hari, zona Asia/Jakarta (PRD A-09). */
settingsRouter.put('/hours', async (req, res) => {
  const { hours } = operatingHoursInputSchema.parse(req.body);
  await prisma.$transaction(
    hours.map((hour) =>
      prisma.operatingHour.upsert({
        where: { dayOfWeek: hour.dayOfWeek },
        update: { isOpen: hour.isOpen, openTime: hour.openTime, closeTime: hour.closeTime },
        create: hour,
      }),
    ),
  );
  res.json(await loadSettingsDto());
});
