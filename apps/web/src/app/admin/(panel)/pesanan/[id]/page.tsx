import type { Metadata } from 'next';
import { AdminOrderDetail } from '@/components/admin/order-detail';
import { BackButton, PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Detail Pesanan' };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <PageHeader title="Detail Pesanan" largeTitle={false} leading={<BackButton fallbackHref="/admin" />} />
      <div className="mx-auto max-w-2xl px-4 pt-2">
        <AdminOrderDetail orderId={id} />
      </div>
    </>
  );
}
