import type { Metadata } from 'next';
import { QrisSettings } from '@/components/admin/settings-store';

export const metadata: Metadata = { title: 'QRIS' };

export default function QrisPage() {
  return <QrisSettings />;
}
