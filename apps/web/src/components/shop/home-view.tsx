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
import { useRef } from 'react';
import { ChevronRight, Clock, MapPin, MessageCircle } from '@/components/ui/icons';
import { ListRow, ListSection, RowIcon } from '@/components/ui/list';
import { cn } from '@/lib/cn';
import { useStoreQuery } from '@/lib/queries';
import { riseOrder } from '@/lib/motion';
import { useCartQuantities } from '@/lib/use-cart-quantities';
import { BannerCarousel } from './banner-carousel';
import { CategoryTiles } from './category-tiles';
import { HERO_SHEET_OVERLAP_CLASS, HomeHero } from './home-hero';
import { MenuCard } from './menu-card';
import { StoreClosedNotice } from './store-status';

function SectionTitle({
  title,
  href,
  linkLabel = 'Lihat semua',
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex reveal items-end justify-between gap-3">
      <h2 className="text-title-3 font-bold">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center text-subhead text-tint tap">
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
    <div className="-mx-4 no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-1 pb-3">
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

export function HomeView({ store: initialStore, home }: { store: StoreDto; home: HomeResponse }) {
  const { data: store = initialStore } = useStoreQuery(initialStore);
  const quantities = useCartQuantities();
  const today = getTodayHours(store.hours);
  const heroRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col lg:px-6 lg:pt-8">
      <HomeHero store={store} heroRef={heroRef} sheetRef={sheetRef} />

      {/* Wadah konten bersudut membulat di atas langit (seperti sheet iOS). Header menempel di
          belakang, jadi saat di-scroll wadah ini yang naik menutupinya. Bayangannya dipasang di
          ::before setinggi 128 px di bagian atas saja, sehingga tidak pernah muncul di ujung
          bawah konten. Di desktop tanpa bayangan. Selama splash wadah menunggu di bawah layar
          (.home-sheet di globals.css). */}
      <div
        ref={sheetRef}
        className={cn(
          'home-sheet relative z-10 rounded-t-[28px] bg-canvas pt-2.5 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-32 before:rounded-t-[28px] before:shadow-[0_-16px_28px_-14px_rgb(0_0_0/0.5)] lg:rounded-t-[32px] lg:before:hidden',
          HERO_SHEET_OVERLAP_CLASS,
        )}
      >
        <div className="mx-auto h-1.5 w-10 rounded-full bg-label-3/40" aria-hidden="true" />
        <div className="flex flex-col gap-8 px-4 pt-5 pb-8 lg:px-6">
          {home.banners.length > 0 && (
            <div className="animate-rise" style={riseOrder(5)}>
              <BannerCarousel banners={home.banners} />
            </div>
          )}

          {!store.status.isOpen && (
            <div className="animate-rise" style={riseOrder(6)}>
              <StoreClosedNotice status={store.status} />
            </div>
          )}

          <section aria-label="Kategori">
            <CategoryTiles categories={home.categories} riseFrom={7} />
          </section>

          {home.bestSellers.length > 0 && (
            <section>
              <SectionTitle title="Paling Laris" href="/menu" />
              <HorizontalCards items={home.bestSellers} ranked />
            </section>
          )}

          {home.recommended.length > 0 && (
            <section className="-mx-4 reveal section-wash px-4 py-9 lg:-mx-6 lg:px-6">
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

          <ListSection header="Info Warung" className="reveal">
            <ListRow
              leading={<RowIcon icon={MapPin} tint="red" />}
              title={store.name}
              subtitle={store.address}
            />
            <ListRow
              leading={<RowIcon icon={Clock} tint="orange" />}
              title="Jam buka hari ini"
              value={
                today?.isOpen
                  ? `${formatClock(today.openTime)}–${formatClock(today.closeTime)}`
                  : 'Libur'
              }
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
      </div>
    </div>
  );
}
