import type { Metadata } from 'next';
import { HistoryView } from '@/components/order/history-view';

export const metadata: Metadata = { title: 'Riwayat Pesanan' };

export default function HistoryPage() {
  return <HistoryView />;
}
