import type { Metadata } from 'next';
import { StoreProfileSettings } from '@/components/admin/settings-store';

export const metadata: Metadata = { title: 'Profil Warung' };

export default function StoreProfilePage() {
  return <StoreProfileSettings />;
}
