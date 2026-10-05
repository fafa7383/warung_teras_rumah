import type { Request, Response } from 'express';
import type { AdminEvent } from '@wtr/shared';

// Hub Server-Sent Events untuk dashboard admin (pesanan baru & perubahan status).
// Satu proses API saja (Railway), jadi cukup disimpan di memori.
const adminStreams = new Set<Response>();

export function subscribeAdminEvents(req: Request, res: Response) {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n\n');
  adminStreams.add(res);

  // Komentar berkala agar koneksi tidak diputus proxy saat sepi.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => {
    clearInterval(heartbeat);
    adminStreams.delete(res);
  });
}

export function publishAdminEvent(event: AdminEvent) {
  const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const stream of adminStreams) stream.write(payload);
}

export function closeAllEventStreams() {
  for (const stream of adminStreams) stream.end();
  adminStreams.clear();
}
