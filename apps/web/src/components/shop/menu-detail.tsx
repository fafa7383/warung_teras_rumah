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
import { AnimatePresence, motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { WarungLoader } from '@/components/brand/warung-loader';
import { AnimatedRupiah } from '@/components/motion/animated-number';
import { Button, IconButton } from '@/components/ui/button';
import { ChoiceRow, Stepper } from '@/components/ui/controls';
import { Flame, X } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { Sheet, SheetBody, SheetFooter } from '@/components/ui/sheet';
import { useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks';
import { easeOutExpo, fadeUp, staggerChildren } from '@/lib/motion';
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
  const ctaRef = useRef<HTMLButtonElement>(null);

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
    // Gambar menu terbang dari tombol ke keranjang setelah sheet turun.
    if (addToCart(item, selected, quantity, { source: ctaRef.current, launchDelayMs: 260 })) onDone();
  };

  return (
    <>
      <SheetBody>
        <div className="relative aspect-video w-full overflow-hidden bg-canvas">
          <motion.div
            className="size-full"
            initial={{ scale: 1.15, opacity: 0.4 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
          >
            <MenuImage
              src={item.imageUrl}
              alt={item.name}
              categorySlug={item.categorySlug}
              sizes="(min-width: 1024px) 560px, 100vw"
              grayscale={!item.isAvailable}
              priority
            />
          </motion.div>
          <IconButton label="Tutup" onClick={onDone} className="absolute top-4 right-4 z-10">
            <X size={20} strokeWidth={2.6} aria-hidden="true" />
          </IconButton>
        </div>

        <motion.div
          className="px-4 pt-4 pb-5"
          variants={staggerChildren(0.06, 0.08)}
          initial="hidden"
          animate="show"
        >
          <motion.h2 variants={fadeUp} className="text-title-2 font-bold">
            {item.name}
          </motion.h2>
          {item.description && (
            <motion.p variants={fadeUp} className="mt-1 text-subhead text-label-2">
              {item.description}
            </motion.p>
          )}
          <motion.p variants={fadeUp} className="mt-2 text-headline text-tint">
            {formatRupiah(item.basePrice)}
          </motion.p>
          {!item.isAvailable && (
            <motion.p variants={fadeUp} className="mt-3 rounded-control bg-fill px-3 py-2 text-footnote text-label-2">
              Yah, menu ini lagi habis. Coba menu lain dulu ya, Kak.
            </motion.p>
          )}
        </motion.div>

        <motion.div
          className="flex flex-col gap-6 bg-canvas px-4 pt-5 pb-8"
          variants={staggerChildren(0.07, 0.15)}
          initial="hidden"
          animate="show"
        >
          {item.optionGroups.map((group) => {
            const hint = groupHint(group);
            const missing = missingGroups.has(group.id);
            return (
              <motion.div key={group.id} variants={fadeUp}>
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
                footer={
                  <AnimatePresence initial={false}>
                    {missing && (
                      <motion.span
                        key="missing"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="block text-red-text"
                      >
                        {missingMessage(group)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                }
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
              </motion.div>
            );
          })}

          <motion.div variants={fadeUp}>
            <ListSection>
              <ListRow
                title="Jumlah"
                trailing={
                  <Stepper value={quantity} onChange={setQuantity} min={1} max={MAX_ITEM_QTY} label="jumlah porsi" />
                }
              />
            </ListSection>
          </motion.div>
        </motion.div>
      </SheetBody>
      <SheetFooter>
        <Button ref={ctaRef} fullWidth disabled={!canSubmit} onClick={submit} className={cn(canSubmit && 'shine')}>
          {!item.isAvailable ? (
            'Menu ini lagi habis'
          ) : (
            <>
              {editLine ? 'Simpan Perubahan' : 'Tambah ke Keranjang'} ·&nbsp;
              <AnimatedRupiah value={priced.lineTotal} />
            </>
          )}
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
  standalone = false,
}: {
  item: MenuItemDto;
  /** Dibuka langsung dari link: tutup = pindah ke Menu/Keranjang, bukan history.back. */
  standalone?: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    // Mode ubah (?edit=) dibuka dari Keranjang, jadi kembali ke sana.
    const closeHref = new URLSearchParams(window.location.search).has('edit') ? '/keranjang' : '/menu';
    // Tunggu animasi turun selesai sebelum pindah route.
    setTimeout(() => (standalone ? router.replace(closeHref, { scroll: false }) : router.back()), 300);
  };

  return (
    <Sheet open={open} onClose={close} label={item.name} size="large">
      {/* Isi menunggu hidrasi agar data keranjang (mode ubah) sudah terbaca dari localStorage. */}
      {hydrated && <MenuDetailBody item={item} onDone={close} />}
    </Sheet>
  );
}

/**
 * Mode ubah (?edit=<baris keranjang>) dibaca di browser, bukan di server, agar halaman Detail Menu
 * tetap statis dan ikut ter-prefetch: sheet langsung terbuka berisi saat kartu menu diketuk.
 * Baru dirender setelah hidrasi, jadi render statisnya tidak jatuh ke render klien.
 */
function MenuDetailBody({ item, onDone }: { item: MenuItemDto; onDone: () => void }) {
  const editKey = useSearchParams().get('edit') ?? undefined;
  return <MenuDetailContent key={editKey ?? ''} item={item} editKey={editKey} onDone={onDone} />;
}

/**
 * Sheet Detail Menu sementara (loading route): langsung naik saat menu diketuk, lalu digantikan
 * sheet asli di posisi yang sama begitu datanya siap.
 */
export function MenuDetailLoading() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const close = () => {
    setOpen(false);
    setTimeout(() => router.back(), 300);
  };

  return (
    <Sheet open={open} onClose={close} label="Memuat detail menu" size="large" placeholder>
      <div className="flex min-h-[420px] flex-1 items-center justify-center">
        <WarungLoader topic="detail" />
      </div>
    </Sheet>
  );
}
