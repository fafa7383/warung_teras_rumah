import { describe, expect, it } from 'vitest';
import { ORDER_STATUSES, STATUS_ACTORS } from './enums';
import {
  FINAL_ORDER_STATUSES,
  canTransition,
  getAdvanceTargetStatus,
  getConfirmTargetStatus,
  getInitialStatus,
  getStatusFlow,
} from './order-status';

describe('alur status pesanan (PRD Bagian 7)', () => {
  it('status awal tergantung metode bayar', () => {
    expect(getInitialStatus('QRIS')).toBe('AWAITING_PAYMENT');
    expect(getInitialStatus('CASH')).toBe('AWAITING_CONFIRMATION');
  });

  it('urutan status per kombinasi sesuai tabel PRD', () => {
    expect(getStatusFlow({ orderType: 'DINE_IN', paymentMethod: 'CASH' })).toEqual([
      'AWAITING_CONFIRMATION',
      'CONFIRMED',
    ]);
    expect(getStatusFlow({ orderType: 'DINE_IN', paymentMethod: 'QRIS' })).toEqual([
      'AWAITING_PAYMENT',
      'AWAITING_CONFIRMATION',
      'CONFIRMED',
    ]);
    expect(getStatusFlow({ orderType: 'DELIVERY', paymentMethod: 'CASH' })).toEqual([
      'AWAITING_CONFIRMATION',
      'PROCESSING',
      'DELIVERING',
      'COMPLETED',
    ]);
    expect(getStatusFlow({ orderType: 'DELIVERY', paymentMethod: 'QRIS' })).toEqual([
      'AWAITING_PAYMENT',
      'AWAITING_CONFIRMATION',
      'PROCESSING',
      'DELIVERING',
      'COMPLETED',
    ]);
  });

  it('konfirmasi pemilik: dine-in selesai, delivery lanjut diproses', () => {
    expect(getConfirmTargetStatus('DINE_IN')).toBe('CONFIRMED');
    expect(getConfirmTargetStatus('DELIVERY')).toBe('PROCESSING');
    const dineIn = { orderType: 'DINE_IN', paymentMethod: 'CASH' } as const;
    const delivery = { orderType: 'DELIVERY', paymentMethod: 'CASH' } as const;
    expect(canTransition('AWAITING_CONFIRMATION', 'CONFIRMED', 'ADMIN', dineIn)).toBe(true);
    expect(canTransition('AWAITING_CONFIRMATION', 'CONFIRMED', 'ADMIN', delivery)).toBe(false);
    expect(canTransition('AWAITING_CONFIRMATION', 'PROCESSING', 'ADMIN', delivery)).toBe(true);
  });

  it('status delivery hanya bisa maju', () => {
    const delivery = { orderType: 'DELIVERY', paymentMethod: 'QRIS' } as const;
    expect(getAdvanceTargetStatus('PROCESSING')).toBe('DELIVERING');
    expect(getAdvanceTargetStatus('DELIVERING')).toBe('COMPLETED');
    expect(getAdvanceTargetStatus('AWAITING_CONFIRMATION')).toBeNull();
    expect(canTransition('DELIVERING', 'PROCESSING', 'ADMIN', delivery)).toBe(false);
    expect(canTransition('PROCESSING', 'AWAITING_CONFIRMATION', 'ADMIN', delivery)).toBe(false);
  });

  it('upload bukti hanya untuk QRIS dan hanya oleh pembeli', () => {
    const qris = { orderType: 'DINE_IN', paymentMethod: 'QRIS' } as const;
    const cash = { orderType: 'DINE_IN', paymentMethod: 'CASH' } as const;
    expect(canTransition('AWAITING_PAYMENT', 'AWAITING_CONFIRMATION', 'CUSTOMER', qris)).toBe(true);
    expect(canTransition('AWAITING_PAYMENT', 'AWAITING_CONFIRMATION', 'CUSTOMER', cash)).toBe(false);
    expect(canTransition('AWAITING_PAYMENT', 'AWAITING_CONFIRMATION', 'ADMIN', qris)).toBe(false);
    expect(canTransition('AWAITING_PAYMENT', 'EXPIRED', 'SYSTEM', qris)).toBe(true);
    expect(canTransition('AWAITING_PAYMENT', 'EXPIRED', 'CUSTOMER', qris)).toBe(false);
  });

  it('pembeli bisa membatalkan sebelum dikonfirmasi saja', () => {
    const kind = { orderType: 'DELIVERY', paymentMethod: 'QRIS' } as const;
    expect(canTransition('AWAITING_PAYMENT', 'CANCELLED', 'CUSTOMER', kind)).toBe(true);
    expect(canTransition('AWAITING_CONFIRMATION', 'CANCELLED', 'CUSTOMER', kind)).toBe(true);
    expect(canTransition('PROCESSING', 'CANCELLED', 'CUSTOMER', kind)).toBe(false);
  });

  it('status akhir tidak bisa diubah lagi', () => {
    for (const from of FINAL_ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        for (const actor of STATUS_ACTORS) {
          for (const orderType of ['DINE_IN', 'DELIVERY'] as const) {
            for (const paymentMethod of ['CASH', 'QRIS'] as const) {
              expect(canTransition(from, to, actor, { orderType, paymentMethod })).toBe(false);
            }
          }
        }
      }
    }
  });
});
