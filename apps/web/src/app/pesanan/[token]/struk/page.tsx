import type { Metadata } from 'next';
import { ReceiptView } from '@/components/order/receipt-view';

export const metadata: Metadata = { title: 'Struk' };

export default async function ReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ReceiptView token={token} />;
}
