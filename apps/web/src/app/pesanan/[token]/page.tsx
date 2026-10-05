import type { Metadata } from 'next';
import { OrderStatusView } from '@/components/order/order-status-view';

export const metadata: Metadata = { title: 'Status Pesanan' };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OrderStatusView token={token} />;
}
