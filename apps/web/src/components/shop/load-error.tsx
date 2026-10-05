'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { BowlArt } from '@/components/brand/food-art';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/** Saat API tidak bisa dihubungi: bahasa ramah, bukan "error 500" (PRD 3.7). */
export function LoadError({ message = 'Ada kendala saat memuat menu, coba lagi ya.' }: { message?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <EmptyState
      className="pt-24"
      art={<BowlArt variant="bakso" size={96} spoon={false} className="opacity-70 grayscale" />}
      title="Yah, menunya belum kebuka"
      message={message}
      action={
        <Button fullWidth loading={pending} onClick={() => startTransition(() => router.refresh())}>
          Coba Lagi
        </Button>
      }
    />
  );
}
