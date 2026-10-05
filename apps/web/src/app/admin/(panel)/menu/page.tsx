import type { Metadata } from 'next';
import { MenuManageView } from '@/components/admin/menu-manage-view';

export const metadata: Metadata = { title: 'Kelola Menu' };

export default function AdminMenuPage() {
  return <MenuManageView />;
}
