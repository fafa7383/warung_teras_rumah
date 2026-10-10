'use client';

import { useLinkStatus } from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Sorotan berdenyut di dalam <Link> selama halaman tujuan belum siap (mis. prefetch belum
 * selesai di jaringan lambat), supaya ketukan terasa "masuk". Selalu dirender agar tidak
 * menggeser tata letak; hanya opacity yang berubah.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      data-pending={pending ? '' : undefined}
      className={cn('link-pending pointer-events-none absolute inset-0 rounded-full', className)}
    />
  );
}
