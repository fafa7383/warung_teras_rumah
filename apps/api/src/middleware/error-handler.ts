import type { ErrorRequestHandler, RequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { isProduction } from '../env';
import { HttpError } from '../lib/http-error';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Halaman tidak ditemukan' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  // Dicek juga lewat nama untuk berjaga bila ada dua salinan zod di node_modules.
  if (err instanceof ZodError || err?.name === 'ZodError') {
    const issues = (err as ZodError).issues;
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: issues[0]?.message ?? 'Ada isian yang belum sesuai, cek lagi ya',
        details: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE';
    res.status(tooLarge ? 413 : 400).json({
      error: { code: err.code, message: tooLarge ? 'Ukuran foto maksimal 5 MB' : 'Upload foto tidak valid' },
    });
    return;
  }

  // Error dari body parser (JSON rusak, body terlalu besar, dll.).
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: { code: 'BAD_REQUEST', message: 'Permintaan tidak valid' } });
    return;
  }

  // Pesan error bisa berisi data pembeli (mis. dari Prisma), jadi di produksi hanya nama & kode yang dicatat.
  console.error('Unhandled error', isProduction ? { name: err?.name, code: err?.code } : err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Ada kendala, coba lagi ya' } });
};
