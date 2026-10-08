'use client';

import { MAX_ORDER_LINES, priceSelection, type MenuItemDto } from '@wtr/shared';
import { flyToCart } from '@/components/motion/fly-to-cart';
import { useCartStore } from './cart-store';
import { vibrate } from './device';
import { toast } from './toast-store';
import { useUiStore } from './ui-store';

interface AddOptions {
  /** Elemen/posisi asal animasi "terbang ke keranjang" (mis. tombol +). */
  source?: Element | DOMRect | null;
  /** Tunda peluncuran, mis. menunggu sheet detail turun dulu. */
  launchDelayMs?: number;
}

/** Masukkan menu + opsi ke keranjang, lalu animasi terbang + toast (PRD 6.2). */
export function useAddToCart() {
  const addLine = useCartStore((state) => state.addLine);

  return (item: MenuItemDto, optionIds: string[], quantity: number, options: AddOptions = {}): boolean => {
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

    vibrate();
    toast.success(`${item.name} masuk keranjang`);
    if (options.source) {
      // Posisi diukur sekarang (sebelum sheet tertutup), peluncuran boleh ditunda.
      const rect = options.source instanceof Element ? options.source.getBoundingClientRect() : options.source;
      const launch = () => flyToCart(rect, { imageUrl: item.imageUrl, categorySlug: item.categorySlug });
      if (options.launchDelayMs) setTimeout(launch, options.launchDelayMs);
      else launch();
    } else {
      useUiStore.getState().bumpCart();
    }
    return true;
  };
}
