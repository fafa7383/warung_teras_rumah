import { env, isProduction } from '../env';

// Alamat jaringan lokal (WiFi rumah): localhost, 10.x, 172.16–31.x, 192.168.x.
const LAN_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|10(\.\d{1,3}){3}|172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}|192\.168(\.\d{1,3}){2})(:\d+)?$/;

/**
 * Asal web yang boleh memanggil API: domain di WEB_ORIGIN, dan saat development juga
 * alamat jaringan lokal agar aplikasi bisa dicoba dari HP lewat WiFi yang sama.
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (env.WEB_ORIGIN.includes(origin)) return true;
  return !isProduction && LAN_ORIGIN.test(origin);
}
