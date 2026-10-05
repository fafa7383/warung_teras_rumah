'use client';

import { LOCAL_HISTORY_MAX } from '@wtr/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface HistoryEntry {
  token: string;
  code: string;
  createdAt: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  add: (entry: HistoryEntry) => void;
}

/** Riwayat pesanan hanya di HP ini (PRD 6.7): maksimal 30 token terakhir. */
export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries.filter((e) => e.token !== entry.token)].slice(0, LOCAL_HISTORY_MAX),
        })),
    }),
    { name: 'wtr-history', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export interface CustomerProfile {
  name: string;
  phone: string;
  address: string;
  landmark: string;
}

interface CustomerState {
  remember: boolean;
  profile: CustomerProfile | null;
  save: (profile: CustomerProfile) => void;
  setRemember: (remember: boolean) => void;
}

/** "Simpan data untuk pesanan berikutnya" (PRD 6.4), default tercentang. */
export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      remember: true,
      profile: null,
      save: (profile) => set({ profile }),
      setRemember: (remember) => set(remember ? { remember } : { remember, profile: null }),
    }),
    { name: 'wtr-customer', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
