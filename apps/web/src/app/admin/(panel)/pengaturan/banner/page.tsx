import type { Metadata } from 'next';
import { BannerSettings } from '@/components/admin/settings-catalog';

export const metadata: Metadata = { title: 'Banner Promo' };

export default function BannerPage() {
  return <BannerSettings />;
}
