'use client';

import { BowlArt } from '@/components/brand/food-art';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { WifiOff } from '@/components/ui/icons';

export function OfflineView() {
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <EmptyState
        art={
          <div className="relative">
            <BowlArt variant="bakso" size={112} spoon={false} className="opacity-70 grayscale" />
            <span className="absolute -right-2 -bottom-1 flex size-10 items-center justify-center rounded-full bg-surface text-label-2 shadow-card">
              <WifiOff size={20} aria-hidden="true" />
            </span>
          </div>
        }
        title="Kamu lagi offline, Kak"
        message="Sambungkan internet dulu, lalu coba lagi ya."
        action={
          <Button fullWidth onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        }
      />
    </main>
  );
}
