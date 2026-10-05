'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface IncomingOrder {
  id: string;
  code: string;
  total: number;
}

interface AdminUiState {
  /** Banner "Pesanan baru!" yang menempel di atas (PRD 8.2). */
  incoming: IncomingOrder | null;
  setIncoming: (order: IncomingOrder | null) => void;
}

export const useAdminUi = create<AdminUiState>()((set) => ({
  incoming: null,
  setIncoming: (incoming) => set({ incoming }),
}));

interface AdminLocalState {
  /** Pesanan Menunggu Konfirmasi yang sudah dibuka; bunyi berulang berhenti untuk yang sudah dilihat. */
  seenOrderIds: string[];
  onboardingDismissed: boolean;
  visited: Record<string, boolean>;
  markSeen: (id: string) => void;
  dismissOnboarding: () => void;
  markVisited: (key: 'hours' | 'menu') => void;
}

export const useAdminLocal = create<AdminLocalState>()(
  persist(
    (set) => ({
      seenOrderIds: [],
      onboardingDismissed: false,
      visited: {},
      markSeen: (id) =>
        set((state) => (state.seenOrderIds.includes(id) ? state : { seenOrderIds: [id, ...state.seenOrderIds].slice(0, 200) })),
      dismissOnboarding: () => set({ onboardingDismissed: true }),
      markVisited: (key) => set((state) => ({ visited: { ...state.visited, [key]: true } })),
    }),
    { name: 'wtr-admin', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
