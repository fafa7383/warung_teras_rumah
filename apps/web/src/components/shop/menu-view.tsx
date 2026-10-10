'use client';

import type { MenuItemDto, MenuResponse } from '@wtr/shared';
import { AnimatePresence, motion } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BowlArt } from '@/components/brand/food-art';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/fields';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/cn';
import { useDebouncedValue, usePrefersReducedMotion } from '@/lib/hooks';
import { spring } from '@/lib/motion';
import { useMenuQuery } from '@/lib/queries';
import { useCartQuantities } from '@/lib/use-cart-quantities';
import { MenuCard } from './menu-card';

const ALL = 'semua';
/** Tinggi bar + area filter yang menempel; dipakai scroll-spy & scroll-margin section. */
const STICKY_OFFSET = 190;

const normalize = (text: string) => text.toLocaleLowerCase('id').trim();

function matches(item: MenuItemDto, query: string) {
  return normalize(item.name).includes(query) || normalize(item.description ?? '').includes(query);
}

/** Menu habis selalu di akhir kategorinya (PRD 6.2). */
const availableFirst = (a: MenuItemDto, b: MenuItemDto) => Number(b.isAvailable) - Number(a.isAvailable);

/**
 * Kategori (?kategori=) dan fokus kolom cari (?cari=1) dari link Home dibaca di browser, bukan
 * di server, agar halaman Menu tetap statis dan ikut ter-prefetch penuh.
 */
function MenuLinkIntent({
  onCategory,
  onSearch,
}: {
  onCategory: (slug: string) => void;
  onSearch: () => void;
}) {
  const params = useSearchParams();
  const category = params.get('kategori');
  const search = params.get('cari') === '1';

  useEffect(() => {
    if (search) onSearch();
  }, [search, onSearch]);

  useEffect(() => {
    if (!category) return;
    // Tunggu layout pertama selesai sebelum melompat ke kategori dari Home.
    const frame = requestAnimationFrame(() => onCategory(category));
    return () => cancelAnimationFrame(frame);
  }, [category, onCategory]);

  return null;
}

export function MenuView({ menu: initialMenu }: { menu: MenuResponse }) {
  const { data: menu = initialMenu } = useMenuQuery(initialMenu);
  const quantities = useCartQuantities();
  const reduceMotion = usePrefersReducedMotion();
  const [query, setQuery] = useState('');
  const debouncedQuery = normalize(useDebouncedValue(query, 250));
  const [activeSlug, setActiveSlug] = useState(ALL);
  const searchRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const sections = useRef(new Map<string, HTMLElement>());
  const programmaticScroll = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groups = useMemo(
    () =>
      menu.categories
        .map((category) => ({
          category,
          items: menu.items
            .filter((item) => item.categoryId === category.id && (!debouncedQuery || matches(item, debouncedQuery)))
            .sort(availableFirst),
        }))
        .filter((group) => group.items.length > 0),
    [menu, debouncedQuery],
  );

  const scrollToCategory = useCallback(
    (slug: string, behavior: ScrollBehavior) => {
      setActiveSlug(slug);
      if (programmaticScroll.current) clearTimeout(programmaticScroll.current);
      programmaticScroll.current = setTimeout(() => {
        programmaticScroll.current = null;
      }, 800);
      if (slug === ALL) {
        window.scrollTo({ top: 0, behavior });
        return;
      }
      sections.current.get(slug)?.scrollIntoView({ behavior, block: 'start' });
    },
    [],
  );

  const focusSearch = useCallback(() => searchRef.current?.focus(), []);
  const jumpToCategory = useCallback((slug: string) => scrollToCategory(slug, 'auto'), [scrollToCategory]);

  // Scroll-spy: chip aktif mengikuti section yang sedang di bawah area filter.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (programmaticScroll.current) return;
        let current = ALL;
        let closestTop = Number.NEGATIVE_INFINITY;
        for (const [slug, element] of sections.current) {
          const top = element.getBoundingClientRect().top;
          if (top <= STICKY_OFFSET + 8 && top > closestTop) {
            closestTop = top;
            current = slug;
          }
        }
        setActiveSlug(current);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [groups]);

  // Chip aktif selalu terlihat di baris chip.
  useEffect(() => {
    const container = chipsRef.current;
    const chip = container?.querySelector<HTMLElement>(`[data-chip="${activeSlug}"]`);
    if (!container || !chip) return;
    const target = chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2;
    container.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeSlug, reduceMotion]);

  const chips = [{ slug: ALL, name: 'Semua' }, ...menu.categories.map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <>
      <Suspense fallback={null}>
        <MenuLinkIntent onCategory={jumpToCategory} onSearch={focusSearch} />
      </Suspense>
      <PageHeader title="Semua Menu" />

      <div className="glass hairline-b sticky top-[calc(env(safe-area-inset-top)+52px)] z-20 flex flex-col gap-2.5 py-2.5 lg:top-16">
        <div className="px-4 lg:px-6">
          <SearchField
            ref={searchRef}
            value={query}
            onChange={setQuery}
            placeholder="Cari bakso, seblak, es teh…"
          />
        </div>
        <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-4 lg:px-6" role="tablist" aria-label="Kategori">
          {chips.map((chip) => {
            const active = chip.slug === activeSlug;
            return (
              <motion.button
                key={chip.slug}
                type="button"
                role="tab"
                aria-selected={active}
                data-chip={chip.slug}
                onClick={() => scrollToCategory(chip.slug, reduceMotion ? 'auto' : 'smooth')}
                whileTap={{ scale: 0.92 }}
                transition={spring.snappy}
                className={cn(
                  'relative h-9 shrink-0 rounded-full bg-surface px-4 text-subhead font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-colors duration-200',
                  active ? 'text-tint-pressed' : 'text-label',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="menu-chip-pill"
                    className="absolute inset-0 rounded-full bg-tint-soft"
                    transition={spring.smooth}
                  />
                )}
                <span className="relative">{chip.name}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          art={<BowlArt variant="bakso" size={96} spoon={false} className="opacity-60 grayscale" />}
          title="Belum ketemu, Kak"
          message={`Menu "${query.trim()}" belum ada, Kak. Coba kata lain ya.`}
        />
      ) : (
        <div className="flex flex-col gap-8 px-4 pt-5 lg:px-6">
          {groups.map(({ category, items }) => (
            <section
              key={category.id}
              data-slug={category.slug}
              ref={(element) => {
                if (element) sections.current.set(category.slug, element);
                else sections.current.delete(category.slug);
              }}
              style={{ scrollMarginTop: STICKY_OFFSET }}
              aria-labelledby={`kategori-${category.slug}`}
            >
              <h2 id={`kategori-${category.slug}`} className="reveal mb-3 text-title-3 font-bold">
                {category.name} <span className="text-subhead font-medium text-label-2">· {items.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-3 @4xl:grid-cols-4">
                {/* Saat mencari, kartu yang hilang mengecil keluar dan sisanya bergeser halus ke tempat baru. */}
                <AnimatePresence mode="popLayout" initial={false}>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={spring.smooth}
                    >
                      <MenuCard item={item} quantityInCart={quantities.get(item.id)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
