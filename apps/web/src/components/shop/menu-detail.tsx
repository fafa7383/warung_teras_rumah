'use client';

import {
  MAX_ITEM_QTY,
  formatPriceDelta,
  formatRupiah,
  getDefaultOptionIds,
  priceSelection,
  validateSelection,
  type MenuItemDto,
  type OptionGroupDto,
} from '@wtr/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, IconButton } from '@/components/ui/button';
import { ChoiceRow, Stepper } from '@/components/ui/controls';
import { Flame, X } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { Sheet, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks';
import { toast } from '@/lib/toast-store';
import { useAddToCart } from '@/lib/use-add-to-cart';
import { MenuImage } from './menu-image';

function groupHint(group: OptionGroupDto): { text: string; required: boolean } {
  if (group.isRequired && group.type === 'SINGLE') return { text: 'Wajib pilih 1', required: true };
  if (group.isRequired) return { text: group.maxSelect ? `Wajib, maks. ${group.maxSelect}` : 'Wajib', required: true };
  if (group.type === 'MULTIPLE' && group.maxSelect) return { text: `Opsional, maks. ${group.maxSelect}`, required: false };
  return { text: 'Opsional', required: false };
}

/** "Level 3" → 3 ikon cabai agar mudah dibaca. */
function chiliCount(name: string): number {
  const match = /level\s*(\d)/i.exec(name);
  return match ? Number(match[1]) : 0;
}

function missingMessage(group: OptionGroupDto) {
  return `Pilih ${group.name.toLowerCase()} dulu ya`;
}

interface MenuDetailProps {
  item: MenuItemDto;
  /** Kunci baris keranjang bila sheet dibuka untuk mengubah opsi (PRD 6.4). */
  editKey?: string;
  onDone: () => void;
}

function MenuDetailContent({ item, editKey, onDone }: MenuDetailProps) {
  const editLine = useCartStore((state) => state.lines.find((line) => line.key === editKey));
  const replaceLine = useCartStore((state) => state.replaceLine);
  const addToCart = useAddToCart();

  const [selected, setSelected] = useState<string[]>(() => editLine?.optionIds ?? getDefaultOptionIds(item));
  const [quantity, setQuantity] = useState(() => editLine?.quantity ?? 1);

  const issues = validateSelection(item, selected, quantity);
  const missingGroups = new Set(issues.flatMap((issue) => (issue.code === 'REQUIRED_GROUP_MISSING' ? [issue.groupId] : [])));
  const priced = priceSelection(item, selected, quantity);
  const canSubmit = item.isAvailable && issues.length === 0;

  const toggle = (group: OptionGroupDto, optionId: string) => {
    const groupOptionIds = new Set(group.options.map((option) => option.id));
    setSelected((current) => {
      if (group.type === 'SINGLE') return [...current.filter((id) => !groupOptionIds.has(id)), optionId];
      if (current.includes(optionId)) return current.filter((id) => id !== optionId);
      const count = current.filter((id) => groupOptionIds.has(id)).length;
      if (group.maxSelect && count >= group.maxSelect) {
        toast.info(`Maksimal ${group.maxSelect} ${group.name.toLowerCase()} ya`);
        return current;
      }
      return [...current, optionId];
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    if (editLine) {
      replaceLine(editLine.key, {
        menuItemId: item.id,
        slug: item.slug,
        name: item.name,
        imageUrl: item.imageUrl,
        categorySlug: item.categorySlug,
        optionIds: selected,
        options: priced.options,
        unitPrice: priced.unitPrice,
        quantity,
      });
      toast.success('Pesanan di keranjang diperbarui');
      onDone();
      return;
    }
    if (addToCart(item, selected, quantity)) onDone();
  };

  return (
    <>
      <SheetBody>
        <div className="relative aspect-video w-full overflow-hidden bg-canvas">
          <MenuImage
            src={item.imageUrl}
            alt={item.name}
            categorySlug={item.categorySlug}
            sizes="(min-width: 1024px) 560px, 100vw"
            grayscale={!item.isAvailable}
            priority
          />
          <IconButton label="Tutup" onClick={onDone} className="absolute top-4 right-4 z-10">
            <X size={20} strokeWidth={2.6} aria-hidden="true" />
          </IconButton>
        </div>

        <div className="px-4 pt-4 pb-5">
          <h2 className="text-title-2 font-bold">{item.name}</h2>
          {item.description && <p className="mt-1 text-subhead text-label-2">{item.description}</p>}
          <p className="mt-2 text-headline text-tint">{formatRupiah(item.basePrice)}</p>
          {!item.isAvailable && (
            <p className="mt-3 rounded-control bg-fill px-3 py-2 text-footnote text-label-2">
              Yah, menu ini lagi habis. Coba menu lain dulu ya, Kak.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 bg-canvas px-4 pt-5 pb-8">
          {item.optionGroups.map((group) => {
            const hint = groupHint(group);
            const missing = missingGroups.has(group.id);
            return (
              <ListSection
                key={group.id}
                header={group.name}
                trailing={
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-caption font-semibold',
                      hint.required ? 'bg-orange-soft text-orange-text' : 'bg-fill text-label-2',
                    )}
                  >
                    {hint.text}
                  </span>
                }
                footer={missing ? <span className="text-red-text">{missingMessage(group)}</span> : undefined}
              >
                <div role={group.type === 'SINGLE' ? 'radiogroup' : 'group'} aria-label={group.name} className="list-separators">
                  {group.options.map((option) => {
                    const chilies = chiliCount(option.name);
                    return (
                      <ChoiceRow
                        key={option.id}
                        multiple={group.type === 'MULTIPLE'}
                        selected={selected.includes(option.id)}
                        onSelect={() => toggle(group, option.id)}
                        disabled={!item.isAvailable}
                        title={
                          <span className="inline-flex items-center gap-1.5">
                            {option.name}
                            {chilies > 0 && (
                              <span className="inline-flex text-red" aria-hidden="true">
                                {Array.from({ length: chilies }, (_, i) => (
                                  <Flame key={i} size={14} fill="currentColor" />
                                ))}
                              </span>
                            )}
                          </span>
                        }
                        trailing={formatPriceDelta(option.priceDelta) || undefined}
                      />
                    );
                  })}
                </div>
              </ListSection>
            );
          })}

          <ListSection>
            <ListRow
              title="Jumlah"
              trailing={
                <Stepper value={quantity} onChange={setQuantity} min={1} max={MAX_ITEM_QTY} label="jumlah porsi" />
              }
            />
          </ListSection>
        </div>
      </SheetBody>
      <SheetFooter>
        <Button fullWidth disabled={!canSubmit} onClick={submit}>
          {!item.isAvailable
            ? 'Menu ini lagi habis'
            : `${editLine ? 'Simpan Perubahan' : 'Tambah ke Keranjang'} · ${formatRupiah(priced.lineTotal)}`}
        </Button>
      </SheetFooter>
    </>
  );
}

/**
 * Detail Menu sebagai bottom sheet (HP) / modal (desktop).
 * Dibuka lewat route /menu/[slug] agar URL bisa dibagikan (PRD 4.1).
 */
export function MenuDetailSheet({
  item,
  editKey,
  closeHref,
}: {
  item: MenuItemDto;
  editKey?: string;
  /** Saat halaman dibuka langsung dari link, tutup = pindah ke halaman ini (bukan history.back). */
  closeHref?: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    // Tunggu animasi turun selesai sebelum pindah route.
    setTimeout(() => (closeHref ? router.replace(closeHref, { scroll: false }) : router.back()), 300);
  };

  return (
    <Sheet open={open} onClose={close} label={item.name} size="large">
      {/* Isi menunggu hidrasi agar data keranjang (mode ubah) sudah terbaca dari localStorage. */}
      {hydrated && <MenuDetailContent item={item} editKey={editKey} onDone={close} />}
    </Sheet>
  );
}
