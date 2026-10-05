'use client';

import { useMemo } from 'react';
import { quantityByMenu, useCartStore } from './cart-store';
import { useHydrated } from './hooks';

/** Jumlah per menu di keranjang; kosong sebelum hidrasi agar SSR & client sama. */
export function useCartQuantities(): Map<string, number> {
  const hydrated = useHydrated();
  const lines = useCartStore((state) => state.lines);
  return useMemo(() => (hydrated ? quantityByMenu(lines) : new Map<string, number>()), [hydrated, lines]);
}
