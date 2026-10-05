'use client';

import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, 'id' | 'durationMs'> & { durationMs?: number }) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show: (toast) => {
    const id = nextId++;
    const entry: Toast = { durationMs: 3000, ...toast, id };
    // Satu toast pada satu waktu, seperti HUD iOS.
    set({ toasts: [entry] });
    setTimeout(() => get().dismiss(id), entry.durationMs);
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Toast 3 detik di atas tab bar (PRD 3.6). */
export const toast = {
  success: (message: string, action?: Toast['action']) =>
    useToastStore.getState().show({ message, tone: 'success', action, durationMs: action ? 5000 : 3000 }),
  error: (message: string) => useToastStore.getState().show({ message, tone: 'error' }),
  info: (message: string) => useToastStore.getState().show({ message, tone: 'info' }),
};
