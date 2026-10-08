import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { isProduction } from './env';
import { isAllowedOrigin } from './lib/origins';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';
import { publicRouter } from './routes/public';

export function createApp() {
  const app = express();

  // Railway menaruh API di belakang 1 proxy; dibutuhkan agar rate limit membaca IP asli pembeli.
  app.set('trust proxy', isProduction ? 1 : false);

  // Web & API berada di site yang sama (warungterasrumah.com / api.warungterasrumah.com).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(
    cors({
      // Request tanpa Origin (mis. health check, server-side fetch Next.js) tidak dibatasi CORS.
      origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/health', healthRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', publicRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
