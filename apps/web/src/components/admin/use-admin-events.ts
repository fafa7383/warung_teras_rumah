'use client';

import type { AdminEvent } from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { adminKeys } from '@/lib/admin-api';
import { playChime } from '@/lib/admin-sound';
import { useAdminUi } from '@/lib/admin-store';
import { vibrate } from '@/lib/device';
import { publicEnv } from '@/lib/env';

/**
 * Real-time lewat SSE (PRD 8.2): pesanan baru → bunyi + getar + banner,
 * perubahan status → daftar & detail diperbarui. EventSource menyambung ulang otomatis.
 */
export function useAdminEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const source = new EventSource(`${publicEnv.apiUrl}/api/admin/events`, { withCredentials: true });

    const handle = (raw: MessageEvent<string>) => {
      let event: AdminEvent;
      try {
        event = JSON.parse(raw.data) as AdminEvent;
      } catch {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: adminKeys.orders });
      void queryClient.invalidateQueries({ queryKey: adminKeys.order(event.order.id) });
      // Perlu tindakan: cash baru masuk, atau bukti QRIS baru diupload.
      if (event.order.status === 'AWAITING_CONFIRMATION') {
        useAdminUi.getState().setIncoming({ id: event.order.id, code: event.order.code, total: event.order.total });
        playChime();
        vibrate([200, 100, 200]);
      }
    };

    source.addEventListener('order.created', handle);
    source.addEventListener('order.updated', handle);
    return () => source.close();
  }, [queryClient]);
}
