'use client';

import {
  getDefaultOptionIds,
  priceSelection,
  validateSelection,
  type CartLineInput,
  type MenuResponse,
  type OrderItemDto,
} from '@wtr/shared';
import type { QueryClient } from '@tanstack/react-query';
import { useCartStore, type CartLine } from './cart-store';
import { fetchMenuClient, queryKeys } from './queries';

export const toCartLineInput = (line: CartLine): CartLineInput => ({
  menuItemId: line.menuItemId,
  optionIds: line.optionIds,
  quantity: line.quantity,
});

/**
 * "Pesan Lagi" (PRD B-15): item yang masih tersedia masuk keranjang dengan harga terbaru,
 * sisanya dilaporkan sebagai habis.
 */
export async function reorderItems(
  queryClient: QueryClient,
  items: readonly OrderItemDto[],
): Promise<{ added: number; unavailable: number }> {
  const menu = await queryClient.fetchQuery<MenuResponse>({ queryKey: queryKeys.menu, queryFn: fetchMenuClient });
  const byId = new Map(menu.items.map((item) => [item.id, item]));
  const { addLine } = useCartStore.getState();
  let added = 0;
  let unavailable = 0;

  for (const orderItem of items) {
    const item = byId.get(orderItem.menuItemId);
    if (!item || !item.isAvailable) {
      unavailable++;
      continue;
    }
    // Pakai opsi yang sama bila masih valid; bila opsi sudah berubah, pakai pilihan default.
    const previous = orderItem.options.map((option) => option.optionId);
    const optionIds = validateSelection(item, previous, orderItem.quantity).length === 0 ? previous : getDefaultOptionIds(item);
    if (validateSelection(item, optionIds, orderItem.quantity).length > 0) {
      unavailable++;
      continue;
    }
    const priced = priceSelection(item, optionIds, orderItem.quantity);
    const result = addLine({
      menuItemId: item.id,
      slug: item.slug,
      name: item.name,
      imageUrl: item.imageUrl,
      categorySlug: item.categorySlug,
      optionIds,
      options: priced.options,
      unitPrice: priced.unitPrice,
      quantity: orderItem.quantity,
    });
    if (result === 'full') unavailable++;
    else added++;
  }
  return { added, unavailable };
}
