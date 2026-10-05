import type { Metadata } from 'next';
import { SettingsHome } from '@/components/admin/settings-home';

export const metadata: Metadata = { title: 'Pengaturan' };

export default function SettingsHomePage() {
  return <SettingsHome />;
}
