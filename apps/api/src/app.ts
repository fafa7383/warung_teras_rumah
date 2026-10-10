import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env, isProduction } from './env';
import { isAllowedOrigin } from './lib/origins';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { adminRouter } from './routes/admin';
import { healthRouter } from './routes/health';
import { publicRouter } from './routes/public';

export function createApp() {
  const app = express();

  // Hosting menaruh API di belakang proxy (Render: 1); dibutuhkan agar rate limit membaca IP
  // asli pembeli. Pembeli memanggil API langsung, admin lewat proxy web (lihat next.config.ts).
  app.set('trust proxy', isProduction ? env.TRUST_PROXY_HOPS : false);

  // CORP hanya berlaku untuk request no-cors (gambar/skrip); panggilan fetch lintas domain dari
  // web tetap diatur CORS di bawah.
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
