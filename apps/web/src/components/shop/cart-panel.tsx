'use client';

import { formatRupiah } from '@wtr/shared';
import { usePathname } from 'next/navigation';
import { BowlArt } from '@/components/brand/food-art';
import { ButtonLink } from '@/components/ui/button';
import { cartTotals, useCartStore } from '@/lib/cart-store';
import { useHydrated } from '@/lib/hooks';
import { CartLineRow } from './cart-line';

/** Panel keranjang di kanan (≥ 1280 px) yang selalu terlihat di Home & Menu (PRD 4.4). */
export function CartPanel() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const lines = useCartStore((state) => state.lines);
  if (!(pathname === '/' || pathname.startsWith('/menu'))) return null;

  const visibleLines = hydrated ? lines : [];
  const { count, subtotal } = cartTotals(visibleLines);

  return (
    <aside aria-label="Keranjang" className="hidden w-[380px] shrink-0 xl:block">
      <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-card bg-surface shadow-card">
        <div className="hairline-b px-4 py-3.5">
          <h2 className="text-headline">Keranjang</h2>
          <p className="text-footnote text-label-2">{count > 0 ? `${count} item` : 'Belum ada pesanan'}</p>
        </div>
        {visibleLines.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <BowlArt variant="bakso" size={72} spoon={false} className="opacity-60 grayscale" />
            <p className="mt-3 text-subhead text-label-2">Pilih menu favoritmu, Kak. Keranjang tampil di sini.</p>
          </div>
        ) : (
          <>
            <div className="list-separators min-h-0 flex-1 overflow-y-auto">
              {visibleLines.map((line) => (
                <CartLineRow key={line.key} line={line} compact />
              ))}
            </div>
            <div className="hairline-t flex flex-col gap-3 p-4">
              <div className="flex justify-between text-subhead">
                <span className="text-label-2">Subtotal</span>
                <span className="font-bold">{formatRupiah(subtotal)}</span>
              </div>
              <ButtonLink href="/keranjang" fullWidth>
                Lanjut ke Checkout
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
