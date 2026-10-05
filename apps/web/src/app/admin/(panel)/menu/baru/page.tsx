import type { Metadata } from 'next';
import { MenuFormView } from '@/components/admin/menu-form-view';

export const metadata: Metadata = { title: 'Menu Baru' };

export default function NewMenuPage() {
  return <MenuFormView />;
}
