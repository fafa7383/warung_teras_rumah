// Fetch data API dari server component (SSR halaman menu, PRD 10.1).
import type { HomeResponse, MenuResponse, StoreDto } from '@wtr/shared';
import { publicEnv } from './env';

// Di server boleh memakai URL internal (mis. jaringan privat Railway) bila diisi.
const baseUrl = (process.env.API_URL_INTERNAL ?? publicEnv.apiUrl).replace(/\/+$/, '');

/** Data publik di-cache 10 detik: perubahan stok terlihat pembeli ≤ 10 detik (PRD A-06). */
async function getJson<T>(path: string, revalidate = 10): Promise<T | null> {
  try {
    const response = await fetch(`${baseUrl}${path}`, { next: { revalidate } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export const fetchStore = () => getJson<StoreDto>('/api/store');
export const fetchHome = () => getJson<HomeResponse>('/api/home');
export const fetchMenu = () => getJson<MenuResponse>('/api/menu');
