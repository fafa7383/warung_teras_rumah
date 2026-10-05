import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LoadError } from '@/components/shop/load-error';
import { MenuDetailSheet } from '@/components/shop/menu-detail';
import { MenuView } from '@/components/shop/menu-view';
import { fetchMenu } from '@/lib/server-api';

type Params = Promise<{ slug: string }>;

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
export default async function MenuItemPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ slug }, { edit }, menu] = await Promise.all([params, searchParams, fetchMenu()]);
  if (!menu) return <LoadError />;
  const item = menu.items.find((menuItem) => menuItem.slug === slug);
  if (!item) notFound();
  return (
    <>
      <MenuView menu={menu} />
      <MenuDetailSheet key={`${item.id}-${edit ?? ''}`} item={item} editKey={edit} closeHref={edit ? '/keranjang' : '/menu'} />
    </>
  );
}
