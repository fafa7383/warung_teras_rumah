'use client';

import {
  formatRupiah,
  getDefaultOptionIds,
  getMenuPriceDisplay,
  type MenuItemDto,
} from '@wtr/shared';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { RollingNumber } from '@/components/motion/animated-number';
import { Check, Plus } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { riseOrder, spring } from '@/lib/motion';
import { toast } from '@/lib/toast-store';
import { useAddToCart } from '@/lib/use-add-to-cart';
import { MenuImage } from './menu-image';

interface MenuCardProps {
  item: MenuItemDto;
  variant?: 'grid' | 'compact';
  /** Jumlah menu ini di keranjang (badge di pojok foto). */
  quantityInCart?: number;
  /** Peringkat di "Paling Laris" (kartu pertama: "#1 Terlaris"). */
  rank?: number;
  /** Urutan muncul berurutan; tanpa ini kartu muncul saat di-scroll ke layar. */
  riseIndex?: number;
  priority?: boolean;
}

export function menuHref(slug: string) {
  return `/menu/${slug}`;
}

export function MenuCard({
  item,
  variant = 'grid',
  quantityInCart = 0,
  rank,
  riseIndex,
  priority,
}: MenuCardProps) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const plusRef = useRef<HTMLButtonElement>(null);
  const [justAdded, setJustAdded] = useState(false);
  const { price, isStartingPrice } = getMenuPriceDisplay(item);
  const needsOptions = item.optionGroups.some(
    (group) => group.isRequired && group.options.length > 0,
  );
  const soldOut = !item.isAvailable;
  const href = menuHref(item.slug);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1100);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const onPlus = () => {
    if (soldOut) {
      toast.info('Yah, menu ini lagi habis');
      return;
    }
    if (needsOptions) {
      router.push(href, { scroll: false });
      return;
    }
    if (addToCart(item, getDefaultOptionIds(item), 1, { source: plusRef.current }))
      setJustAdded(true);
  };

  return (
    // Animasi masuk (CSS) di pembungkus, efek tekan (Motion) di kartu, agar tidak saling menimpa.
    <div
      className={cn(
        riseIndex === undefined ? 'reveal' : 'animate-rise',
        variant === 'compact' && 'w-[148px] shrink-0 snap-start',
      )}
      style={riseIndex === undefined ? undefined : riseOrder(riseIndex)}
    >
      <motion.article
        whileTap={{ scale: 0.975 }}
        transition={spring.snappy}
        className="group relative flex h-full flex-col rounded-card bg-surface shadow-card"
      >
        <Link
          href={href}
          scroll={false}
          className="absolute inset-0 z-0 rounded-card"
          aria-label={`Lihat detail ${item.name}`}
        />
        <div className="pointer-events-none relative m-1.5 mb-0 aspect-square overflow-hidden rounded-tile">
          <div className="size-full transition-transform duration-500 ease-out group-hover:scale-105">
            <MenuImage
              src={item.imageUrl}
              alt={item.name}
              categorySlug={item.categorySlug}
              sizes={variant === 'compact' ? '148px' : '(min-width: 1024px) 25vw, 50vw'}
              grayscale={soldOut}
              priority={priority}
            />
          </div>
          <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
            {rank === 1 ? (
              <Badge>Terlaris No. 1</Badge>
            ) : (
              item.isBestSeller && <Badge>Terlaris</Badge>
            )}
            {item.isSpicy && variant === 'grid' && <Badge tone="spicy">Pedas</Badge>}
          </div>
          <AnimatePresence>
            {quantityInCart > 0 && (
              <motion.span
                key="qty"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={spring.bouncy}
                className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-tint text-caption font-bold text-white ring-2 ring-white"
                aria-label={`${quantityInCart} di keranjang`}
              >
                <RollingNumber value={quantityInCart} />
              </motion.span>
            )}
          </AnimatePresence>
          {soldOut && (
            <span className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/70 px-2.5 py-1 text-caption font-semibold text-white">
              Habis
            </span>
          )}
        </div>
        <div className="pointer-events-none flex flex-1 flex-col px-3 pt-2 pb-3">
          <h3 className={cn('line-clamp-2 text-subhead font-semibold', soldOut && 'text-label-2')}>
            {item.name}
          </h3>
          {variant === 'grid' && item.description && (
            <p className="line-clamp-1 text-footnote text-label-2">{item.description}</p>
          )}
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className={cn('text-subhead font-bold', soldOut ? 'text-label-2' : 'text-tint')}>
              {isStartingPrice && (
                <span className="block text-caption font-medium text-label-2">mulai</span>
              )}
              {formatRupiah(price)}
            </p>
            <motion.button
              ref={plusRef}
              type="button"
              onClick={onPlus}
              aria-label={soldOut ? `${item.name} habis` : `Tambah ${item.name}`}
              aria-disabled={soldOut || undefined}
              whileTap={soldOut ? undefined : { scale: 0.8 }}
              animate={{
                backgroundColor: soldOut
                  ? 'rgba(118,118,128,0.12)'
                  : justAdded
                    ? '#248A3D'
                    : '#D63C3C',
              }}
              transition={spring.snappy}
              className={cn(
                'pointer-events-auto relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full',
                soldOut ? 'text-label-3' : 'text-white',
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={justAdded ? 'check' : 'plus'}
                  initial={{ scale: 0.3, rotate: justAdded ? -90 : 90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.3, rotate: justAdded ? 90 : -90, opacity: 0 }}
                  transition={spring.snappy}
                  className="inline-flex"
                >
                  {justAdded ? (
                    <Check size={20} strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <Plus size={20} strokeWidth={2.6} aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

/** Label kecil ala iOS: kapsul putih buram bergaris tipis, teks saja. */
function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'spicy';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-caption font-semibold ring-1 ring-black/[0.06] backdrop-blur-sm',
        tone === 'spicy' ? 'text-red-text' : 'text-label',
      )}
    >
      {children}
    </span>
  );
}
