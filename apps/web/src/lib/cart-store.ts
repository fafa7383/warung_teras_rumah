'use client';

import {
  MAX_ITEM_QTY,
  MAX_ORDER_LINES,
  cartLineKey,
  type CartLineStatus,
  type CartValidateResponse,
  type OptionSnapshot,
} from '@wtr/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartLine {
  key: string;
  menuItemId: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  categorySlug: string;
  optionIds: string[];
  options: OptionSnapshot[];
  unitPrice: number;
  quantity: number;
  /** Diisi dari validasi server: menu habis / dihapus / opsinya berubah. */
  problem?: Exclude<CartLineStatus, 'OK'> | null;
}

export type NewCartLine = Omit<CartLine, 'key' | 'problem'>;

interface CartState {
  lines: CartLine[];
  addLine: (line: NewCartLine) => 'added' | 'merged' | 'full';
  replaceLine: (oldKey: string, line: NewCartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  /** Terapkan hasil POST /cart/validate; urutan respons sama dengan urutan `lines`. */
  applyValidation: (result: CartValidateResponse, sentKeys: string[]) => { priceChanged: boolean; problems: number };
}

function mergeLine(lines: CartLine[], line: NewCartLine): { lines: CartLine[]; merged: boolean } {
  const key = cartLineKey(line.menuItemId, line.optionIds);
  const existing = lines.find((l) => l.key === key);
  if (existing) {
    return {
      merged: true,
      lines: lines.map((l) =>
        l.key === key
          ? { ...l, ...line, key, quantity: Math.min(MAX_ITEM_QTY, l.quantity + line.quantity), problem: null }
          : l,
      ),
    };
  }
  return { merged: false, lines: [...lines, { ...line, key, problem: null }] };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line) => {
        const { lines } = get();
        const key = cartLineKey(line.menuItemId, line.optionIds);
        if (!lines.some((l) => l.key === key) && lines.length >= MAX_ORDER_LINES) return 'full';
        const result = mergeLine(lines, line);
        set({ lines: result.lines });
        return result.merged ? 'merged' : 'added';
      },
      replaceLine: (oldKey, line) =>
        set((state) => {
          const newKey = cartLineKey(line.menuItemId, line.optionIds);
          const target = newKey !== oldKey ? state.lines.find((l) => l.key === newKey) : undefined;
          if (target) {
            // Kombinasi opsi baru sama dengan baris lain: gabungkan.
            return {
              lines: state.lines
                .filter((l) => l.key !== oldKey)
                .map((l) =>
                  l.key === newKey
                    ? { ...l, ...line, key: newKey, quantity: Math.min(MAX_ITEM_QTY, l.quantity + line.quantity), problem: null }
                    : l,
                ),
            };
          }
          // Ganti di posisi yang sama.
          return {
            lines: state.lines.map((l) => (l.key === oldKey ? { ...line, key: newKey, problem: null } : l)),
          };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines: state.lines.map((l) =>
            l.key === key ? { ...l, quantity: Math.max(1, Math.min(MAX_ITEM_QTY, quantity)) } : l,
          ),
        })),
      removeLine: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      applyValidation: (result, sentKeys) => {
        let priceChanged = false;
        let problems = 0;
        const byKey = new Map(sentKeys.map((key, index) => [key, result.lines[index]]));
        set((state) => ({
          lines: state.lines.map((line) => {
            const checked = byKey.get(line.key);
            if (!checked) return line;
            if (checked.status !== 'OK') {
              problems++;
              return { ...line, problem: checked.status };
            }
            if (checked.unitPrice !== null && checked.unitPrice !== line.unitPrice) priceChanged = true;
            return {
              ...line,
              problem: null,
              name: checked.name ?? line.name,
              slug: checked.slug ?? line.slug,
              imageUrl: checked.imageUrl,
              unitPrice: checked.unitPrice ?? line.unitPrice,
              options: checked.options,
            };
          }),
        }));
        return { priceChanged, problems };
      },
    }),
    {
      name: 'wtr-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export function cartTotals(lines: readonly CartLine[]) {
  return lines.reduce(
    (acc, line) => ({ count: acc.count + line.quantity, subtotal: acc.subtotal + line.unitPrice * line.quantity }),
    { count: 0, subtotal: 0 },
  );
}

/** Jumlah per menu (untuk badge "2" di pojok foto kartu menu). */
export function quantityByMenu(lines: readonly CartLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) map.set(line.menuItemId, (map.get(line.menuItemId) ?? 0) + line.quantity);
  return map;
}
