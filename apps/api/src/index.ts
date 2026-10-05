import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './env';
import { startScheduler } from './jobs/scheduler';
import { closeAllEventStreams } from './lib/events';
import { prisma } from './lib/prisma';

const server = createServer(createApp());
const stopScheduler = startScheduler();

server.listen(env.PORT, () => {
  console.log(`✓ API Warung Teras Rumah jalan di http://localhost:${env.PORT}`);
});

function shutdown(signal: string) {
  console.log(`${signal} diterima, mematikan server…`);
  stopScheduler();
  // Koneksi SSE yang masih terbuka tidak boleh menahan proses mati.
  closeAllEventStreams();
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
