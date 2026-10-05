'use client';

import {
  ADMIN_ORDERS_POLL_MS,
  type AdminBannerDto,
  type AdminCategoryDto,
  type AdminMeDto,
  type AdminMenuItemDto,
  type AdminMenuResponse,
  type AdminOrderDto,
  type AdminOrderTab,
  type AdminOrdersResponse,
  type AdminSettingsDto,
  type ReportResponse,
} from '@wtr/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api-client';

export const adminKeys = {
  all: ['admin'] as const,
  me: ['admin', 'me'] as const,
  orders: ['admin', 'orders'] as const,
  orderList: (tab: AdminOrderTab, date?: string) => ['admin', 'orders', tab, date ?? ''] as const,
  order: (id: string) => ['admin', 'order', id] as const,
  menu: ['admin', 'menu'] as const,
  menuItem: (id: string) => ['admin', 'menu-item', id] as const,
  categories: ['admin', 'categories'] as const,
  banners: ['admin', 'banners'] as const,
  settings: ['admin', 'settings'] as const,
  report: (from: string, to: string) => ['admin', 'report', from, to] as const,
};

/** Semua request admin lewat sini: path relatif terhadap /api/admin. */
export function adminFetch<T>(path: string, init?: RequestInit) {
  return apiFetch<T>(`/api/admin${path}`, init);
}

export const jsonBody = (data: unknown): RequestInit => ({ body: JSON.stringify(data) });

export function useAdminMe() {
  return useQuery({
    queryKey: adminKeys.me,
    queryFn: () => adminFetch<AdminMeDto>('/auth/me'),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/** Daftar pesanan; SSE memicu refresh, polling 15 detik sebagai cadangan (PRD 8.2). */
export function useAdminOrders(tab: AdminOrderTab, date?: string) {
  const params = new URLSearchParams({ tab, ...(date ? { date } : {}) });
  return useQuery({
    queryKey: adminKeys.orderList(tab, date),
    queryFn: () => adminFetch<AdminOrdersResponse>(`/orders?${params.toString()}`),
    refetchInterval: ADMIN_ORDERS_POLL_MS,
    refetchIntervalInBackground: true,
  });
}

export function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: adminKeys.order(id ?? ''),
    queryFn: () => adminFetch<AdminOrderDto>(`/orders/${id}`),
    enabled: Boolean(id),
    refetchInterval: ADMIN_ORDERS_POLL_MS,
  });
}

export function useAdminSettings() {
  return useQuery({ queryKey: adminKeys.settings, queryFn: () => adminFetch<AdminSettingsDto>('/settings') });
}

export function useAdminMenu() {
  return useQuery({ queryKey: adminKeys.menu, queryFn: () => adminFetch<AdminMenuResponse>('/menu') });
}

export function useAdminMenuItem(id: string | null) {
  return useQuery({
    queryKey: adminKeys.menuItem(id ?? ''),
    queryFn: () => adminFetch<AdminMenuItemDto>(`/menu/${id}`),
    enabled: Boolean(id),
  });
}

export function useAdminCategories() {
  return useQuery({ queryKey: adminKeys.categories, queryFn: () => adminFetch<AdminCategoryDto[]>('/categories') });
}

export function useAdminBanners() {
  return useQuery({ queryKey: adminKeys.banners, queryFn: () => adminFetch<AdminBannerDto[]>('/banners') });
}

export function useAdminReport(from: string, to: string) {
  return useQuery({
    queryKey: adminKeys.report(from, to),
    queryFn: () => adminFetch<ReportResponse>(`/reports?from=${from}&to=${to}`),
  });
}
