import type { Metadata } from 'next';
import { MenuFormView } from '@/components/admin/menu-form-view';

export const metadata: Metadata = { title: 'Ubah Menu' };

export default async function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MenuFormView key={id} menuId={id} />;
}
