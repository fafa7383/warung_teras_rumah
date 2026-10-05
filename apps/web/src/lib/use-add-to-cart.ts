'use client';

import { MAX_ORDER_LINES, priceSelection, type MenuItemDto } from '@wtr/shared';
import { useCartStore } from './cart-store';
import { vibrate } from './device';
import { toast } from './toast-store';
import { useUiStore } from './ui-store';

/** Masukkan menu + opsi ke keranjang, lalu toast + bounce ikon keranjang (PRD 6.2). */
export function useAddToCart() {
  const addLine = useCartStore((state) => state.addLine);
  const bumpCart = useUiStore((state) => state.bumpCart);

  return (item: MenuItemDto, optionIds: string[], quantity: number): boolean => {
    const priced = priceSelection(item, optionIds, quantity);
    const result = addLine({
      menuItemId: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      categorySlug: item.categorySlug,
      optionIds,
      options: priced.options,
      unitPrice: priced.unitPrice,
      quantity,
    });
    if (result === 'full') {
      toast.error(`Keranjang maksimal ${MAX_ORDER_LINES} macam menu`);
      return false;
    }
    bumpCart();
    vibrate();
    toast.success(`${item.name} masuk keranjang`);
    return true;
  };
}
