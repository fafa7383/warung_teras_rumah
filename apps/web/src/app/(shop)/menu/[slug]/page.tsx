import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoadError } from '@/components/shop/load-error';
import { MenuDetailSheet } from '@/components/shop/menu-detail';
import { MenuView } from '@/components/shop/menu-view';
import { fetchMenu } from '@/lib/server-api';

type Params = Promise<{ slug: string }>;

// Statis per menu seperti sheet Detail Menu di @modal; mode ubah ?edit= dibaca di browser.
export async function generateStaticParams() {
  const menu = await fetchMenu();
  return menu?.items.map((item) => ({ slug: item.slug })) ?? [];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [{ slug }, menu] = await Promise.all([params, fetchMenu()]);
  const item = menu?.items.find((menuItem) => menuItem.slug === slug);
  if (!item) return { title: 'Menu' };
  return {
    title: item.name,
    description: item.description ?? `Pesan ${item.name} di Warung Teras Rumah.`,
    openGraph: { title: item.name, images: item.imageUrl ? [item.imageUrl] : undefined },
  };
}

/** Link Detail Menu yang dibuka langsung (dibagikan): daftar menu + sheet terbuka. */
export default async function MenuItemPage({ params }: { params: Params }) {
  const [{ slug }, menu] = await Promise.all([params, fetchMenu()]);
  if (!menu) return <LoadError />;
  const item = menu.items.find((menuItem) => menuItem.slug === slug);
  if (!item) notFound();
  return (
    <>
      <MenuView menu={menu} />
      <MenuDetailSheet key={item.id} item={item} standalone />
    </>
  );
}
