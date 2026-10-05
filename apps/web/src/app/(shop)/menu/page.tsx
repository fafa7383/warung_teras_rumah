import type { Metadata } from 'next';
import { LoadError } from '@/components/shop/load-error';
import { MenuView } from '@/components/shop/menu-view';
import { fetchMenu } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Semua Menu' };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; cari?: string }>;
}) {
  const [{ kategori, cari }, menu] = await Promise.all([searchParams, fetchMenu()]);
  if (!menu) return <LoadError />;
  return <MenuView menu={menu} initialCategory={kategori} autoFocusSearch={cari === '1'} />;
}
