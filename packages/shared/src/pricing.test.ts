import { describe, expect, it } from 'vitest';
import {
  calculateOrderTotals,
  cartLineKey,
  formatOptionSummary,
  getDefaultOptionIds,
  getMenuPriceDisplay,
  priceSelection,
  validateSelection,
  type PricingMenuItem,
} from './pricing';

const mieAyam: PricingMenuItem = {
  id: 'mie-ayam',
  name: 'Mie Ayam Biasa',
  basePrice: 12000,
  isAvailable: true,
  optionGroups: [
    {
      id: 'level',
      name: 'Level Pedas',
      type: 'SINGLE',
      isRequired: true,
      maxSelect: null,
      options: [
        { id: 'lv0', name: 'Tidak Pedas', priceDelta: 0, isActive: true },
        { id: 'lv1', name: 'Level 1', priceDelta: 0, isActive: true, isDefault: true },
        { id: 'lv2', name: 'Level 2', priceDelta: 0, isActive: true },
      ],
    },
    {
      id: 'porsi',
      name: 'Porsi',
      type: 'SINGLE',
      isRequired: true,
      maxSelect: null,
      options: [
        { id: 'biasa', name: 'Biasa', priceDelta: 0, isActive: true, isDefault: true },
        { id: 'jumbo', name: 'Jumbo', priceDelta: 5000, isActive: true },
      ],
    },
    {
      id: 'topping',
      name: 'Topping',
      type: 'MULTIPLE',
      isRequired: false,
      maxSelect: 3,
      options: [
        { id: 'telur', name: 'Telur', priceDelta: 3000, isActive: true },
        { id: 'ceker', name: 'Ceker', priceDelta: 4000, isActive: true },
        { id: 'sosis', name: 'Sosis', priceDelta: 3000, isActive: true },
        { id: 'kerupuk', name: 'Kerupuk', priceDelta: 2000, isActive: true },
        { id: 'nonaktif', name: 'Pangsit', priceDelta: 2000, isActive: false },
      ],
    },
  ],
};

describe('validateSelection', () => {
  it('menerima pilihan yang lengkap', () => {
    expect(validateSelection(mieAyam, ['lv1', 'biasa'], 1)).toEqual([]);
  });

  it('menolak grup wajib yang belum dipilih', () => {
    expect(validateSelection(mieAyam, ['lv1'], 1)).toContainEqual({
      code: 'REQUIRED_GROUP_MISSING',
      groupId: 'porsi',
      groupName: 'Porsi',
    });
  });

  it('mematuhi batas maksimal topping', () => {
    const issues = validateSelection(mieAyam, ['lv1', 'biasa', 'telur', 'ceker', 'sosis', 'kerupuk'], 1);
    expect(issues).toContainEqual({ code: 'TOO_MANY_OPTIONS', groupId: 'topping', groupName: 'Topping', max: 3 });
  });

  it('grup pilih-satu tidak boleh lebih dari satu opsi', () => {
    const issues = validateSelection(mieAyam, ['lv1', 'lv2', 'biasa'], 1);
    expect(issues).toContainEqual({ code: 'TOO_MANY_OPTIONS', groupId: 'level', groupName: 'Level Pedas', max: 1 });
  });

  it('menolak opsi milik menu lain, opsi nonaktif, dan opsi ganda', () => {
    const issues = validateSelection(mieAyam, ['lv1', 'biasa', 'asing', 'nonaktif', 'biasa'], 1);
    expect(issues).toContainEqual({ code: 'UNKNOWN_OPTION', optionId: 'asing' });
    expect(issues).toContainEqual({ code: 'UNKNOWN_OPTION', optionId: 'nonaktif' });
    expect(issues).toContainEqual({ code: 'DUPLICATE_OPTION', optionId: 'biasa' });
  });

  it('memeriksa jumlah 1–20 dan ketersediaan menu', () => {
    expect(validateSelection(mieAyam, ['lv1', 'biasa'], 0)).toContainEqual({ code: 'INVALID_QUANTITY' });
    expect(validateSelection(mieAyam, ['lv1', 'biasa'], 21)).toContainEqual({ code: 'INVALID_QUANTITY' });
    expect(validateSelection(mieAyam, ['lv1', 'biasa'], 1.5)).toContainEqual({ code: 'INVALID_QUANTITY' });
    expect(validateSelection({ ...mieAyam, isAvailable: false }, ['lv1', 'biasa'], 1)).toContainEqual({
      code: 'MENU_UNAVAILABLE',
    });
  });
});

describe('priceSelection', () => {
  it('menghitung harga satuan dan total baris dari opsi', () => {
    const line = priceSelection(mieAyam, ['kerupuk', 'jumbo', 'lv2', 'telur'], 2);
    expect(line.unitPrice).toBe(12000 + 5000 + 3000 + 2000);
    expect(line.lineTotal).toBe(44000);
    expect(line.options.map((o) => o.optionId)).toEqual(['lv2', 'jumbo', 'telur', 'kerupuk']);
    expect(formatOptionSummary(line.options)).toBe('Level 2 · Jumbo · +Telur · +Kerupuk');
  });

  it('menjumlahkan total pesanan dengan ongkir gratis', () => {
    expect(calculateOrderTotals([{ lineTotal: 44000 }, { lineTotal: 4000 }])).toEqual({
      subtotal: 48000,
      deliveryFee: 0,
      total: 48000,
    });
  });
});

describe('helper tampilan', () => {
  it('memilih opsi default saat detail menu dibuka', () => {
    expect(getDefaultOptionIds(mieAyam)).toEqual(['lv1', 'biasa']);
  });

  it('menampilkan "mulai" bila ada opsi berbayar', () => {
    expect(getMenuPriceDisplay(mieAyam)).toEqual({ price: 12000, isStartingPrice: true });
    expect(getMenuPriceDisplay({ ...mieAyam, optionGroups: [] })).toEqual({
      price: 12000,
      isStartingPrice: false,
    });
  });

  it('kunci baris keranjang tidak bergantung urutan opsi', () => {
    expect(cartLineKey('m1', ['b', 'a'])).toBe(cartLineKey('m1', ['a', 'b']));
    expect(cartLineKey('m1', ['a'])).not.toBe(cartLineKey('m1', ['a', 'b']));
  });
});
