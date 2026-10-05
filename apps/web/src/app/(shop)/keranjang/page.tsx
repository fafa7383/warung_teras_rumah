import type { Metadata } from 'next';
import { CheckoutView } from '@/components/shop/checkout-view';
import { fetchStore } from '@/lib/server-api';

export const metadata: Metadata = { title: 'Keranjang' };

export default async function CartPage() {
  const store = await fetchStore();
  return <CheckoutView initialStore={store} />;
}
