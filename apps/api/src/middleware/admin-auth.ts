import type { RequestHandler, Response } from 'express';
import { ADMIN_COOKIE, verifySession } from '../lib/auth';
import { HttpError } from '../lib/http-error';
import { isAllowedOrigin } from '../lib/origins';
import { prisma } from '../lib/prisma';

export interface AdminSession {
  id: string;
  username: string;
  tokenVersion: number;
}

export function getAdmin(res: Response): AdminSession {
  const admin = res.locals.admin as AdminSession | undefined;
  if (!admin) throw new HttpError(401, 'UNAUTHENTICATED', 'Silakan login dulu');
  return admin;
}

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token: unknown = req.cookies?.[ADMIN_COOKIE];
  const session = typeof token === 'string' ? verifySession(token) : null;
  if (!session) throw new HttpError(401, 'UNAUTHENTICATED', 'Sesi habis, silakan login lagi');

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, username: true, tokenVersion: true },
  });
  // token_version berubah saat ganti password → sesi lama tidak berlaku.
  if (!admin || admin.tokenVersion !== session.v) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Sesi habis, silakan login lagi');
  }
  res.locals.admin = admin;
  next();
};

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Asal (scheme://host) dari header Referer, untuk proxy yang tidak meneruskan header Origin. */
function refererOrigin(referer: string | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/** Semua request admin yang mengubah data wajib berasal dari domain web sendiri (PRD 10.6). */
export const requireSameOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const origin = req.get('origin') ?? refererOrigin(req.get('referer'));
  if (!isAllowedOrigin(origin)) {
    throw new HttpError(403, 'FORBIDDEN_ORIGIN', 'Permintaan ditolak');
  }
  next();
};
