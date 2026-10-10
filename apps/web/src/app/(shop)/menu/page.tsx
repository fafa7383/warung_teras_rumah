import type { Metadata } from 'next';
import { LoadError } from '@/components/shop/load-error';
import { MenuView } from '@/components/shop/menu-view';
import { fetchMenu } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Semua Menu' };

/**
 * Statis (diperbarui tiap 10 detik) agar ikut ter-prefetch penuh dan pindah dari Home terasa
 * instan. ?kategori= dan ?cari= dari link Home dibaca di browser oleh MenuView.
 */
export default async function MenuPage() {
  const menu = await fetchMenu();
  if (!menu) return <LoadError />;
  return <MenuView menu={menu} />;
}
