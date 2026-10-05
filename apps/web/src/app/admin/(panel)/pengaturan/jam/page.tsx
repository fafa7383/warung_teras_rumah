import type { Metadata } from 'next';
import { HoursSettings } from '@/components/admin/settings-store';

export const metadata: Metadata = { title: 'Jam Operasional' };

export default function HoursPage() {
  return <HoursSettings />;
}
