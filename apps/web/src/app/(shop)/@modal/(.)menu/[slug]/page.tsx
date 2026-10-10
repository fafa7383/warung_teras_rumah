import { MenuDetailSheet } from '@/components/shop/menu-detail';
import { fetchMenu } from '@/lib/server-api';

type Params = Promise<{ slug: string }>;

// Semua menu dirender saat build (data diperbarui tiap 10 detik) agar ikut ter-prefetch: sheet
// langsung terbuka berisi saat kartu menu diketuk, tanpa menunggu server. Menu yang ditambah
// setelah deploy dirender saat pertama dibuka dan memakai sheet loading sampai deploy berikutnya.
export async function generateStaticParams() {
  const menu = await fetchMenu();
  return menu?.items.map((item) => ({ slug: item.slug })) ?? [];
}

/** Detail Menu sebagai sheet di atas halaman yang sedang dibuka (intercepting route). */
export default async function MenuDetailModal({ params }: { params: Params }) {
  const [{ slug }, menu] = await Promise.all([params, fetchMenu()]);
  const item = menu?.items.find((menuItem) => menuItem.slug === slug);
  if (!item) return null;
  return <MenuDetailSheet key={item.id} item={item} />;
}
