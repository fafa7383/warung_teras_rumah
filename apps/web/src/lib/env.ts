// Variabel NEXT_PUBLIC_* ditanam saat build, jadi harus diakses dengan nama lengkap.
export const publicEnv = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, ''),
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
};
