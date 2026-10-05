'use client';

import { formatRupiah, getDefaultOptionIds, getMenuPriceDisplay, type MenuItemDto } from '@wtr/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Flame, Plus, Star } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
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
  priority?: boolean;
}

export function menuHref(slug: string) {
  return `/menu/${slug}`;
}

export function MenuCard({ item, variant = 'grid', quantityInCart = 0, rank, priority }: MenuCardProps) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const { price, isStartingPrice } = getMenuPriceDisplay(item);
  const needsOptions = item.optionGroups.some((group) => group.isRequired && group.options.length > 0);
  const soldOut = !item.isAvailable;
  const href = menuHref(item.slug);

  const onPlus = () => {
    if (soldOut) {
      toast.info('Yah, menu ini lagi habis');
      return;
    }
    if (needsOptions) {
      router.push(href, { scroll: false });
      return;
    }
    addToCart(item, getDefaultOptionIds(item), 1);
  };

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-card bg-surface shadow-card',
        variant === 'compact' && 'w-[148px] shrink-0 snap-start',
      )}
    >
      <Link
        href={href}
        scroll={false}
        className="tap absolute inset-0 z-0 rounded-card"
        aria-label={`Lihat detail ${item.name}`}
      />
      <div className="pointer-events-none relative m-1.5 mb-0 aspect-square overflow-hidden rounded-tile">
        <MenuImage
          src={item.imageUrl}
          alt={item.name}
          categorySlug={item.categorySlug}
          sizes={variant === 'compact' ? '148px' : '(min-width: 1024px) 25vw, 50vw'}
          grayscale={soldOut}
          priority={priority}
        />
        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
          {rank === 1 ? (
            <Badge className="bg-yellow text-label">
              <Star size={12} fill="currentColor" aria-hidden="true" /> #1 Terlaris
            </Badge>
          ) : (
            item.isBestSeller && (
              <Badge className="bg-yellow text-label">
                <Star size={12} fill="currentColor" aria-hidden="true" /> Terlaris
              </Badge>
            )
          )}
          {item.isSpicy && variant === 'grid' && (
            <Badge className="bg-white/90 text-red-text">
              <Flame size={12} fill="currentColor" aria-hidden="true" /> Pedas
            </Badge>
          )}
        </div>
        {quantityInCart > 0 && (
          <span
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-tint text-caption font-bold text-white ring-2 ring-white"
            aria-label={`${quantityInCart} di keranjang`}
          >
            {quantityInCart}
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/70 px-2.5 py-1 text-caption font-semibold text-white">
            Habis
          </span>
        )}
      </div>
      <div className="pointer-events-none flex flex-1 flex-col px-3 pt-2 pb-3">
        <h3 className={cn('line-clamp-2 text-subhead font-semibold', soldOut && 'text-label-2')}>{item.name}</h3>
        {variant === 'grid' && item.description && (
          <p className="line-clamp-1 text-footnote text-label-2">{item.description}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <p className={cn('text-subhead font-bold', soldOut ? 'text-label-2' : 'text-tint')}>
            {isStartingPrice && <span className="block text-caption font-medium text-label-2">mulai</span>}
            {formatRupiah(price)}
          </p>
          <button
            type="button"
            onClick={onPlus}
            aria-label={soldOut ? `${item.name} habis` : `Tambah ${item.name}`}
            aria-disabled={soldOut || undefined}
            className={cn(
              'pointer-events-auto relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.92]',
              soldOut ? 'bg-fill text-label-3' : 'bg-tint text-white shadow-[0_4px_12px_rgb(214_60_60/0.3)]',
            )}
          >
            <Plus size={20} strokeWidth={2.6} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-caption font-semibold shadow-[0_1px_3px_rgb(0_0_0/0.12)]',
        className,
      )}
    >
      {children}
    </span>
  );
}
