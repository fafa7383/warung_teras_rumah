'use client';

import { formatOptionSummary, formatRupiah } from '@wtr/shared';
import Link from 'next/link';
import { useState } from 'react';
import { Stepper } from '@/components/ui/controls';
import { ConfirmDialog } from '@/components/ui/dialog';
import { CircleAlert, Trash2 } from '@/components/ui/icons';
import { useCartStore, type CartLine } from '@/lib/cart-store';
import { cn } from '@/lib/cn';
import { MenuImage } from './menu-image';

const PROBLEM_TEXT = {
  UNAVAILABLE: 'Habis, hapus dulu ya',
  NOT_FOUND: 'Menu sudah tidak dijual, hapus dulu ya',
  INVALID_OPTIONS: 'Pilihannya berubah, tap untuk pilih ulang',
} as const;

/** Satu baris keranjang: foto, nama, ringkasan opsi, harga, stepper (PRD 6.4). */
export function CartLineRow({ line, compact }: { line: CartLine; compact?: boolean }) {
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const summary = formatOptionSummary(line.options);
  const editHref = `/menu/${line.slug}?edit=${encodeURIComponent(line.key)}`;
  const blocked = line.problem === 'UNAVAILABLE' || line.problem === 'NOT_FOUND';

  return (
    <div className={cn('flex gap-3 px-4 py-3', line.problem && 'bg-red-soft/60')}>
      <Link
        href={editHref}
        scroll={false}
        className="tap relative size-14 shrink-0 overflow-hidden rounded-tile"
        aria-label={`Ubah pilihan ${line.name}`}
      >
        <MenuImage src={line.imageUrl} alt="" categorySlug={line.categorySlug} sizes="56px" grayscale={blocked} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link href={editHref} scroll={false} className="tap min-w-0">
          <p className="line-clamp-2 text-subhead font-semibold">{line.name}</p>
          {summary && <p className="line-clamp-2 text-footnote text-label-2">{summary}</p>}
        </Link>
        {line.problem && (
          <p className="flex items-center gap-1 text-footnote font-semibold text-red-text" role="alert">
            <CircleAlert size={14} aria-hidden="true" />
            {PROBLEM_TEXT[line.problem]}
          </p>
        )}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-subhead font-bold text-label">{formatRupiah(line.unitPrice * line.quantity)}</span>
          {blocked ? (
            <button
              type="button"
              onClick={() => removeLine(line.key)}
              className="tap flex h-8 items-center gap-1 rounded-full bg-red-text px-3 text-footnote font-semibold text-white"
            >
              <Trash2 size={14} aria-hidden="true" /> Hapus
            </button>
          ) : (
            <Stepper
              size={compact ? 'sm' : 'md'}
              value={line.quantity}
              min={0}
              label={line.name}
              onChange={(value) => (value < 1 ? setConfirmRemove(true) : setQuantity(line.key, value))}
            />
          )}
        </div>
      </div>
      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={`Hapus ${line.name} dari keranjang?`}
        actions={[
          { label: 'Batal', style: 'cancel', onPress: () => setConfirmRemove(false) },
          {
            label: 'Hapus',
            style: 'destructive',
            onPress: () => {
              setConfirmRemove(false);
              removeLine(line.key);
            },
          },
        ]}
      />
    </div>
  );
}
