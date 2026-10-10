import { Router } from 'express';
import { prisma } from '../lib/prisma';

export const healthRouter = Router();

// Dipakai health check hosting (Render), ping penjaga agar API tidak tidur, dan cek database.
healthRouter.get('/', async (_req, res) => {
  let database: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'error';
  }
  res.status(database === 'ok' ? 200 : 503).json({
    status: database === 'ok' ? 'ok' : 'degraded',
    database,
    time: new Date().toISOString(),
  });
});
