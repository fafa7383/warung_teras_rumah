import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

// Halaman pesanan berisi data pribadi: jangan diindeks mesin pencari (PRD 10.6).
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Status Pesanan & Struk: tanpa tab bar (PRD 4.3). */
export default function OrderLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <main className="min-h-dvh">{children}</main>
      <Toaster />
    </>
  );
}
