import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, isProduction } from './env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health';

export function createApp() {
  const app = express();

  // Railway menaruh API di belakang 1 proxy; dibutuhkan agar rate limit membaca IP asli pembeli.
  app.set('trust proxy', isProduction ? 1 : false);

  // Web & API berada di site yang sama (warungterasrumah.com / api.warungterasrumah.com).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/health', healthRouter);
  // Router publik (/api) dan admin (/api/admin) ditambahkan mulai Hari 2.

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
