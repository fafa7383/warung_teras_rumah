import type { Metadata } from 'next';
import { InstallGuide } from '@/components/admin/settings-system';

export const metadata: Metadata = { title: 'Pasang ke Home Screen' };

export default function InstallGuidePage() {
  return <InstallGuide />;
}
