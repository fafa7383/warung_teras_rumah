import type { Metadata } from 'next';
import { AccountSettings } from '@/components/admin/settings-system';

export const metadata: Metadata = { title: 'Akun & Keamanan' };

export default function AccountPage() {
  return <AccountSettings />;
}
