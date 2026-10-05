'use client';

import {
  CUSTOMER_STATUS_POLL_MS,
  isFinalStatus,
  type MenuResponse,
  type OrderStatusBatchResponse,
  type PublicOrderDto,
  type StoreDto,
} from '@wtr/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api-client';

export const queryKeys = {
  store: ['store'] as const,
  menu: ['menu'] as const,
  order: (token: string) => ['order', token] as const,
  history: (tokens: readonly string[]) => ['order-history', ...tokens] as const,
};

export const fetchMenuClient = () => apiFetch<MenuResponse>('/api/menu');

export function useStoreQuery(initialData?: StoreDto | null) {
  return useQuery({
    queryKey: queryKeys.store,
    queryFn: () => apiFetch<StoreDto>('/api/store'),
    initialData: initialData ?? undefined,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMenuQuery(initialData?: MenuResponse | null) {
  return useQuery({
    queryKey: queryKeys.menu,
    queryFn: fetchMenuClient,
    initialData: initialData ?? undefined,
    staleTime: 10_000,
  });
}

/** Status pesanan diperbarui tiap 10 detik selama belum final; berhenti saat tab tidak aktif (PRD 6.5). */
export function useOrderQuery(token: string) {
  return useQuery({
    queryKey: queryKeys.order(token),
    queryFn: () => apiFetch<PublicOrderDto>(`/api/orders/${encodeURIComponent(token)}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && isFinalStatus(status) ? false : CUSTOMER_STATUS_POLL_MS;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: (count, error) => count < 2 && !(error instanceof Error && 'status' in error && error.status === 404),
  });
}

export function useOrderHistoryQuery(tokens: readonly string[]) {
  return useQuery({
    queryKey: queryKeys.history(tokens),
    queryFn: () =>
      apiFetch<OrderStatusBatchResponse>('/api/orders/status-batch', {
        method: 'POST',
        body: JSON.stringify({ tokens }),
      }),
    enabled: tokens.length > 0,
    refetchInterval: 30_000,
  });
}
