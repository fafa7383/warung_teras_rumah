import type { Metadata } from 'next';
import { CategorySettings } from '@/components/admin/settings-catalog';

export const metadata: Metadata = { title: 'Kategori Menu' };

export default function CategoryPage() {
  return <CategorySettings />;
}
