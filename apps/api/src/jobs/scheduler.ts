import { expireOverdueOrders, purgeOldPaymentProofs } from '../services/orders';

const MINUTE = 60_000;

function every(intervalMs: number, name: string, job: () => Promise<unknown>) {
  let running = false;
  const run = async () => {
    if (running) return; // jangan tumpang tindih bila database sedang lambat
    running = true;
    try {
      await job();
    } catch (error) {
      console.error(`Job "${name}" gagal`, error instanceof Error ? error.name : error);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(run, intervalMs);
  timer.unref();
  void run();
  return timer;
}

/** Job latar (PRD 10.1): kedaluwarsa QRIS tiap menit, hapus bukti bayar lama tiap 6 jam. */
export function startScheduler() {
  const timers = [
    every(MINUTE, 'expire-qris', expireOverdueOrders),
    every(6 * 60 * MINUTE, 'purge-payment-proofs', purgeOldPaymentProofs),
  ];
  return () => timers.forEach(clearInterval);
}
