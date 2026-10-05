import { env } from '../env';
import { HttpError } from './http-error';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** Verifikasi token Cloudflare Turnstile di server (PRD 10.6). */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<void> {
  let success = false;
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: remoteIp }),
      signal: AbortSignal.timeout(8000),
    });
    const result = (await response.json()) as { success?: boolean };
    success = result.success === true;
  } catch {
    throw new HttpError(503, 'CAPTCHA_UNAVAILABLE', 'Captcha lagi bermasalah, coba lagi sebentar ya');
  }
  if (!success) throw new HttpError(400, 'CAPTCHA_FAILED', 'Captcha belum lolos, coba lagi ya');
}
