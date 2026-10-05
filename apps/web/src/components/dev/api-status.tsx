'use client';

import { useEffect, useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { publicEnv } from '@/lib/env';

type Status = 'checking' | 'ok' | 'db-error' | 'offline';

interface HealthResponse {
  status: 'ok' | 'degraded';
  database: 'ok' | 'error';
}

const LABELS: Record<Status, { text: string; className: string }> = {
  checking: { text: 'Mengecek API…', className: 'bg-warning-100 text-ink' },
  ok: { text: 'API & database tersambung', className: 'bg-success-100 text-ink' },
  'db-error': { text: 'API jalan, database belum tersambung', className: 'bg-danger-100 text-danger' },
  offline: { text: 'API belum jalan', className: 'bg-danger-100 text-danger' },
};

/** Indikator sementara untuk memastikan setup lokal; dihapus saat Home dibangun. */
export function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    apiFetch<HealthResponse>('/health')
      .then((health) => setStatus(health.database === 'ok' ? 'ok' : 'db-error'))
      .catch((error: unknown) => {
        setStatus(error instanceof ApiError && error.status === 503 ? 'db-error' : 'offline');
      });
  }, []);

  const label = LABELS[status];
  return (
    <div className="flex flex-col gap-1">
      <span
        role="status"
        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-caption ${label.className}`}
      >
        <span aria-hidden="true">●</span>
        {label.text}
      </span>
      <span className="text-caption text-ink-muted">{publicEnv.apiUrl}/health</span>
    </div>
  );
}
