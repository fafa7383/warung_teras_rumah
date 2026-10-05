'use client';

import {
  buildWhatsAppUrl,
  formatClock,
  getTodayHours,
  type HomeResponse,
  type MenuItemDto,
  type StoreDto,
} from '@wtr/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/logo';
import { Armchair, Bike, ChevronRight, Clock, MapPin, MessageCircle, Search } from '@/components/ui/icons';
import { ListRow, ListSection, RowIcon } from '@/components/ui/list';
import { useStoreQuery } from '@/lib/queries';
import { useCartQuantities } from '@/lib/use-cart-quantities';
import { BannerCarousel } from './banner-carousel';
import { CategoryTiles } from './category-tiles';
import { MenuCard } from './menu-card';
import { HistoryLink } from './navigation';
import { StoreClosedNotice, StoreStatusPill } from './store-status';

function SectionTitle({ title, href, linkLabel = 'Lihat semua' }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <h2 className="text-title-3 font-bold">{title}</h2>
      {href && (
        <Link href={href} className="tap flex items-center text-subhead text-tint">
          {linkLabel}
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function HorizontalCards({ items, ranked }: { items: MenuItemDto[]; ranked?: boolean }) {
  const quantities = useCartQuantities();
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pt-1 pb-3">
      {items.map((item, index) => (
        <MenuCard
          key={item.id}
          item={item}
          variant="compact"
          rank={ranked ? index + 1 : undefined}
          quantityInCart={quantities.get(item.id)}
        />
      ))}
    </div>
  );
}

function InfoPill({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-footnote font-semibold text-label shadow-[0_1px_3px_rgb(0_0_0/0.06)]">
      <span className="text-tint">{icon}</span>
      {children}
    </span>
  );
}

export function HomeView({ store: initialStore, home }: { store: StoreDto; home: HomeResponse }) {
  const { data: store = initialStore } = useStoreQuery(initialStore);
  const quantities = useCartQuantities();
  const today = getTodayHours(store.hours);

  return (
    <div className="flex flex-col gap-8 px-4 pt-[calc(env(safe-area-inset-top)+12px)] lg:px-6 lg:pt-8">
      <header className="flex items-center justify-between gap-3 lg:hidden">
        <Logo compact size={32} />
        <HistoryLink />
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col items-start gap-2.5">
          <StoreStatusPill status={store.status} />
          <h1 className="text-title-1 font-bold lg:text-large-title">Mau makan apa hari ini, Kak?</h1>
        </div>
        <Link
          href="/menu?cari=1"
          className="tap flex h-11 items-center gap-2 rounded-full bg-fill px-4 text-body text-label-2"
        >
          <Search size={18} aria-hidden="true" />
          Cari bakso, seblak, es teh…
        </Link>
        <div className="flex flex-wrap gap-2">
          <InfoPill icon={<Bike size={16} aria-hidden="true" />}>Gratis ongkir</InfoPill>
          <InfoPill icon={<Armchair size={16} aria-hidden="true" />}>Bisa makan di tempat</InfoPill>
        </div>
        <StoreClosedNotice status={store.status} />
      </section>

      <BannerCarousel banners={home.banners} />

      <section aria-label="Kategori">
        <CategoryTiles categories={home.categories} />
      </section>

      {home.bestSellers.length > 0 && (
        <section>
          <SectionTitle title="Paling Laris" href="/menu" />
          <HorizontalCards items={home.bestSellers} ranked />
        </section>
      )}

      {home.recommended.length > 0 && (
        <section className="-mx-4 bg-tint-soft/70 px-4 py-6 lg:mx-0 lg:rounded-sheet lg:px-6">
          <SectionTitle title="Pilihan Teras Rumah" />
          <div className="grid grid-cols-2 gap-3 @2xl:grid-cols-4">
            {home.recommended.map((item) => (
              <MenuCard key={item.id} item={item} quantityInCart={quantities.get(item.id)} />
            ))}
          </div>
        </section>
      )}

      {home.drinks.length > 0 && (
        <section>
          <SectionTitle title="Seger-seger" href="/menu?kategori=minuman" />
          <HorizontalCards items={home.drinks} />
        </section>
      )}

      <ListSection header="Info Warung">
        <ListRow leading={<RowIcon icon={MapPin} tint="red" />} title={store.name} subtitle={store.address} />
        <ListRow
          leading={<RowIcon icon={Clock} tint="orange" />}
          title="Jam buka hari ini"
          value={today?.isOpen ? `${formatClock(today.openTime)}–${formatClock(today.closeTime)}` : 'Libur'}
        />
        {store.whatsapp && (
          <ListRow
            leading={<RowIcon icon={MessageCircle} tint="green" />}
            title="Chat WhatsApp"
            subtitle="Tanya menu atau pesanan"
            href={buildWhatsAppUrl(store.whatsapp, 'Halo Warung Teras Rumah, saya mau tanya.')}
            external
          />
        )}
      </ListSection>
    </div>
  );
}
