import type { Metadata } from 'next';
import { LookupView } from '@/components/order/lookup-view';

export const metadata: Metadata = { title: 'Cek Pesanan', robots: { index: false } };

export default function LookupPage() {
  return <LookupView />;
}
