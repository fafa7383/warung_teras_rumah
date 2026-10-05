import { DELIVERY_FEE, MAX_ITEM_QTY, MIN_ITEM_QTY } from './constants';
import type { OptionGroupType } from './enums';

// Semua uang adalah integer rupiah. Fungsi di sini dipakai di browser (harga real-time)
// dan di server (harga resmi; angka dari browser selalu diabaikan).

export interface PricingOption {
  id: string;
  name: string;
  priceDelta: number;
  isActive: boolean;
  isDefault?: boolean;
}

export interface PricingOptionGroup {
  id: string;
  name: string;
  type: OptionGroupType;
  isRequired: boolean;
  /** Hanya untuk MULTIPLE; null = tanpa batas. */
  maxSelect: number | null;
  options: PricingOption[];
}

export interface PricingMenuItem {
  id: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  /** Diasumsikan sudah terurut sesuai sort_order. */
  optionGroups: PricingOptionGroup[];
}

/** Disimpan sebagai JSON di order_items.options_snapshot. */
export interface OptionSnapshot {
  groupId: string;
  groupName: string;
  groupType: OptionGroupType;
  optionId: string;
  optionName: string;
  priceDelta: number;
}

export type SelectionIssue =
  | { code: 'MENU_UNAVAILABLE' }
  | { code: 'INVALID_QUANTITY' }
  | { code: 'UNKNOWN_OPTION'; optionId: string }
  | { code: 'DUPLICATE_OPTION'; optionId: string }
  | { code: 'REQUIRED_GROUP_MISSING'; groupId: string; groupName: string }
  | { code: 'TOO_MANY_OPTIONS'; groupId: string; groupName: string; max: number };

export interface PricedLine {
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  options: OptionSnapshot[];
}

function maxSelectable(group: PricingOptionGroup): number {
  if (group.type === 'SINGLE') return 1;
  return group.maxSelect ?? Number.POSITIVE_INFINITY;
}

function activeOptions(group: PricingOptionGroup): PricingOption[] {
  return group.options.filter((o) => o.isActive);
}

export function validateSelection(
  menu: PricingMenuItem,
  optionIds: readonly string[],
  quantity: number,
): SelectionIssue[] {
  const issues: SelectionIssue[] = [];

  if (!menu.isAvailable) issues.push({ code: 'MENU_UNAVAILABLE' });
  if (!Number.isInteger(quantity) || quantity < MIN_ITEM_QTY || quantity > MAX_ITEM_QTY) {
    issues.push({ code: 'INVALID_QUANTITY' });
  }

  const groupIdByOption = new Map<string, string>();
  for (const group of menu.optionGroups) {
    for (const option of activeOptions(group)) groupIdByOption.set(option.id, group.id);
  }

  const seen = new Set<string>();
  const countByGroup = new Map<string, number>();
  for (const optionId of optionIds) {
    if (seen.has(optionId)) {
      issues.push({ code: 'DUPLICATE_OPTION', optionId });
      continue;
    }
    seen.add(optionId);
    const groupId = groupIdByOption.get(optionId);
    if (!groupId) {
      issues.push({ code: 'UNKNOWN_OPTION', optionId });
      continue;
    }
    countByGroup.set(groupId, (countByGroup.get(groupId) ?? 0) + 1);
  }

  for (const group of menu.optionGroups) {
    const count = countByGroup.get(group.id) ?? 0;
    // Grup wajib tanpa opsi aktif tidak bisa dipenuhi, jadi tidak memblokir pesanan.
    if (group.isRequired && count === 0 && activeOptions(group).length > 0) {
      issues.push({ code: 'REQUIRED_GROUP_MISSING', groupId: group.id, groupName: group.name });
    }
    const max = maxSelectable(group);
    if (count > max) {
      issues.push({ code: 'TOO_MANY_OPTIONS', groupId: group.id, groupName: group.name, max });
    }
  }

  return issues;
}

/** Opsi terpilih dalam urutan grup lalu urutan opsi; id yang tidak dikenal diabaikan. */
export function resolveSelectedOptions(
  menu: PricingMenuItem,
  optionIds: readonly string[],
): OptionSnapshot[] {
  const selected = new Set(optionIds);
  const snapshots: OptionSnapshot[] = [];
  for (const group of menu.optionGroups) {
    for (const option of activeOptions(group)) {
      if (!selected.has(option.id)) continue;
      snapshots.push({
        groupId: group.id,
        groupName: group.name,
        groupType: group.type,
        optionId: option.id,
        optionName: option.name,
        priceDelta: option.priceDelta,
      });
    }
  }
  return snapshots;
}

export function priceSelection(
  menu: PricingMenuItem,
  optionIds: readonly string[],
  quantity: number,
): PricedLine {
  const options = resolveSelectedOptions(menu, optionIds);
  const unitPrice = menu.basePrice + options.reduce((sum, o) => sum + o.priceDelta, 0);
  return { unitPrice, quantity, lineTotal: unitPrice * quantity, options };
}

export function calculateOrderTotals(lines: readonly { lineTotal: number }[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  return { subtotal, deliveryFee: DELIVERY_FEE, total: subtotal + DELIVERY_FEE };
}

/** Opsi yang sudah terpilih saat Detail Menu dibuka. */
export function getDefaultOptionIds(menu: PricingMenuItem): string[] {
  const ids: string[] = [];
  for (const group of menu.optionGroups) {
    const defaults = activeOptions(group).filter((o) => o.isDefault);
    const limit = Math.min(defaults.length, maxSelectable(group));
    for (const option of defaults.slice(0, limit)) ids.push(option.id);
  }
  return ids;
}

/** Harga yang tampil di kartu menu: "Rp12.000" atau "mulai Rp12.000". */
export function getMenuPriceDisplay(menu: PricingMenuItem): {
  price: number;
  isStartingPrice: boolean;
} {
  let minRequiredDelta = 0;
  let hasPaidOption = false;
  for (const group of menu.optionGroups) {
    const options = activeOptions(group);
    if (options.some((o) => o.priceDelta > 0)) hasPaidOption = true;
    if (group.isRequired && options.length > 0) {
      minRequiredDelta += Math.min(...options.map((o) => o.priceDelta));
    }
  }
  return { price: menu.basePrice + minRequiredDelta, isStartingPrice: hasPaidOption };
}

/** Menu dengan kombinasi opsi yang sama persis digabung menjadi satu baris keranjang. */
export function cartLineKey(menuItemId: string, optionIds: readonly string[]): string {
  return `${menuItemId}|${[...optionIds].sort().join(',')}`;
}

/** Ringkasan kecil di keranjang/struk, mis. "Level 2 · Jumbo · +Telur". */
export function formatOptionSummary(options: readonly OptionSnapshot[]): string {
  return options
    .map((o) => (o.groupType === 'MULTIPLE' ? `+${o.optionName}` : o.optionName))
    .join(' · ');
}
