import type { Metadata } from 'next';
import { NotificationSettings } from '@/components/admin/settings-system';

export const metadata: Metadata = { title: 'Notifikasi & Suara' };

export default function NotificationPage() {
  return <NotificationSettings />;
}
