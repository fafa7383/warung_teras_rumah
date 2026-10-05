import {
  MAX_UPLOAD_BYTES,
  pushSubscriptionSchema,
  pushUnsubscribeSchema,
  reportQuerySchema,
  uploadQuerySchema,
  type PushPublicKeyResponse,
  type UploadImageResponse,
} from '@wtr/shared';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../../env';
import { HttpError } from '../../lib/http-error';
import { processImage } from '../../lib/images';
import { prisma } from '../../lib/prisma';
import { sendPushToAdmins } from '../../lib/push';
import { uploadPublicImage } from '../../lib/storage';
import { buildReport, buildReportCsv } from '../../services/reports';

export const reportsRouter = Router();
export const pushRouter = Router();
export const uploadsRouter = Router();

const MAX_REPORT_DAYS = 366;

function parseReportQuery(query: unknown) {
  const { from, to } = reportQuerySchema.parse(query);
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (days > MAX_REPORT_DAYS) throw new HttpError(400, 'RANGE_TOO_LONG', 'Periode laporan maksimal 1 tahun');
  return { from, to };
}

reportsRouter.get('/', async (req, res) => {
  const { from, to } = parseReportQuery(req.query);
  res.json(await buildReport(from, to));
});

reportsRouter.get('/export.csv', async (req, res) => {
  const { from, to } = parseReportQuery(req.query);
  res
    .set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="laporan-teras-rumah-${from}-sd-${to}.csv"`,
      'Cache-Control': 'no-store',
    })
    .send(await buildReportCsv(from, to));
});

pushRouter.get('/public-key', (_req, res) => {
  const body: PushPublicKeyResponse = { publicKey: env.VAPID_PUBLIC_KEY };
  res.json(body);
});

pushRouter.post('/subscribe', async (req, res) => {
  const { endpoint, keys } = pushSubscriptionSchema.parse(req.body);
  const userAgent = req.get('user-agent')?.slice(0, 300) ?? null;
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userAgent },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
  });
  res.status(204).end();
});

pushRouter.delete('/subscribe', async (req, res) => {
  const { endpoint } = pushUnsubscribeSchema.parse(req.body);
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  res.status(204).end();
});

pushRouter.post('/test', async (_req, res) => {
  const result = await sendPushToAdmins({
    title: 'Tes notifikasi berhasil',
    body: 'Notifikasi pesanan baru akan muncul seperti ini.',
    url: '/admin/pengaturan/notifikasi',
    tag: 'test',
  });
  if (result.sent === 0) {
    throw new HttpError(409, 'NO_SUBSCRIPTION', 'Belum ada HP yang terdaftar. Aktifkan notifikasi dulu.');
  }
  res.json(result);
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

const UPLOAD_FOLDERS = { menu: 'menu', banner: 'banners', logo: 'branding', qris: 'qris' } as const;

/** Foto menu/banner/logo/QRIS: dikompres ke WebP lalu disimpan di bucket publik. */
uploadsRouter.post('/image', upload.single('file'), async (req, res) => {
  const { kind } = uploadQuerySchema.parse(req.query);
  if (!req.file) throw new HttpError(400, 'FILE_REQUIRED', 'Pilih foto dulu ya');
  const image = await processImage(req.file.buffer, kind);
  const body: UploadImageResponse = { url: await uploadPublicImage(UPLOAD_FOLDERS[kind], image) };
  res.status(201).json(body);
});
