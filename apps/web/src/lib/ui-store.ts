'use client';

import { create } from 'zustand';

interface UiState {
  /** Jumlah sheet/dialog yang sedang terbuka; tab bar disembunyikan bila > 0 (PRD 4.3). */
  overlays: number;
  /** Naik setiap item masuk keranjang, memicu animasi bounce ikon keranjang. */
  cartBump: number;
  pushOverlay: () => void;
  popOverlay: () => void;
  bumpCart: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  overlays: 0,
  cartBump: 0,
  pushOverlay: () => set((s) => ({ overlays: s.overlays + 1 })),
  popOverlay: () => set((s) => ({ overlays: Math.max(0, s.overlays - 1) })),
  bumpCart: () => set((s) => ({ cartBump: s.cartBump + 1 })),
}));
