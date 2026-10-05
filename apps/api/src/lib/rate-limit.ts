import rateLimit, { type Options } from 'express-rate-limit';
import { HttpError } from './http-error';

// Batas sesuai PRD 10.6. Penyimpanan di memori cukup karena API berjalan di satu proses.
function createLimiter(windowMs: number, limit: number, message: string, extra: Partial<Options> = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...extra,
    handler: (_req, _res, next) => next(new HttpError(429, 'RATE_LIMITED', message)),
  });
}

const MINUTE = 60_000;

/** 3 pesanan berhasil per 10 menit per IP. */
export const createOrderLimiter = createLimiter(
  10 * MINUTE,
  3,
  'Kamu baru saja memesan beberapa kali. Coba lagi beberapa menit lagi ya.',
  { skipFailedRequests: true },
);

/** 5 percobaan gagal per 10 menit. */
export const lookupLimiter = createLimiter(
  10 * MINUTE,
  5,
  'Terlalu banyak percobaan. Coba lagi 10 menit lagi ya.',
  { skipSuccessfulRequests: true },
);

/** 5 login salah per 15 menit → dikunci sementara. */
export const loginLimiter = createLimiter(
  15 * MINUTE,
  5,
  'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.',
  { skipSuccessfulRequests: true },
);

/** 5 upload bukti per 10 menit per pesanan. */
export const proofUploadLimiter = createLimiter(
  10 * MINUTE,
  5,
  'Terlalu sering upload. Coba lagi beberapa menit lagi ya.',
  { keyGenerator: (req) => `proof:${String(req.params.token ?? '')}` },
);
