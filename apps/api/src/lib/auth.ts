import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProduction } from '../env';

export const ADMIN_COOKIE = 'wtr_admin';
export const SESSION_DAYS_DEFAULT = 7;
export const SESSION_DAYS_REMEMBER = 30;
const DAY_SECONDS = 86_400;

export interface SessionPayload {
  sub: string;
  /** token_version admin saat sesi dibuat. */
  v: number;
}

export function signSession(adminId: string, tokenVersion: number, days: number): string {
  return jwt.sign({ v: tokenVersion }, env.JWT_SECRET, {
    subject: adminId,
    expiresIn: days * DAY_SECONDS,
    algorithm: 'HS256',
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return null;
    if (typeof payload.v !== 'number') return null;
    return { sub: payload.sub, v: payload.v };
  } catch {
    return null;
  }
}

function cookieOptions(): CookieOptions {
  // Domain=.warungterasrumah.com di produksi agar berlaku untuk web & api (PRD 10.3).
  return { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', domain: env.COOKIE_DOMAIN };
}

export function setSessionCookie(res: Response, token: string, days: number) {
  res.cookie(ADMIN_COOKIE, token, { ...cookieOptions(), maxAge: days * DAY_SECONDS * 1000 });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(ADMIN_COOKIE, cookieOptions());
}
