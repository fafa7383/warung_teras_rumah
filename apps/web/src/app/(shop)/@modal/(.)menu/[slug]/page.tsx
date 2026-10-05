import { MenuDetailSheet } from '@/components/shop/menu-detail';
import { fetchMenu } from '@/lib/server-api';

/** Detail Menu sebagai sheet di atas halaman yang sedang dibuka (intercepting route). */
export default async function MenuDetailModal({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ slug }, { edit }, menu] = await Promise.all([params, searchParams, fetchMenu()]);
  const item = menu?.items.find((menuItem) => menuItem.slug === slug);
  if (!item) return null;
  return <MenuDetailSheet key={`${item.id}-${edit ?? ''}`} item={item} editKey={edit} />;
}
