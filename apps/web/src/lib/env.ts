// Variabel NEXT_PUBLIC_* ditanam saat build, jadi harus diakses dengan nama lengkap.
const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(
  /\/+$/,
  '',
);

/**
 * Saat development, website bisa dibuka dari HP lewat WiFi (mis. http://192.168.1.20:3000).
 * Di HP, "localhost" berarti HP itu sendiri, jadi API diarahkan ke alamat laptop yang sama.
 * URL API produksi (bukan localhost) tidak pernah diubah.
 */
function resolveApiUrl(): string {
  if (typeof window === 'undefined') return configuredApiUrl;
  try {
    const url = new URL(configuredApiUrl);
    const pageHost = window.location.hostname;
    if (url.hostname === 'localhost' && pageHost !== 'localhost') {
      url.hostname = pageHost;
      return url.toString().replace(/\/+$/, '');
    }
  } catch {
    // URL tidak valid: pakai apa adanya
  }
  return configuredApiUrl;
}

export const publicEnv = {
  apiUrl: resolveApiUrl(),
  /**
   * API admin. Produksi: path relatif ("") karena /api/admin diteruskan oleh server web ke API
   * (next.config.ts), agar cookie login admin tidak dianggap cookie pihak ketiga.
   */
  adminApiUrl: process.env.NEXT_PUBLIC_ADMIN_API_PROXY === '1' ? '' : resolveApiUrl(),
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
};
