'use client';

import { daypartFromHour, isFinalStatus, type StoreDto } from '@wtr/shared';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'motion/react';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Armchair, Bike, History, Search } from '@/components/ui/icons';
import { cn } from '@/lib/cn';
import { currentWibHour } from '@/lib/day-clock';
import { useHydrated, usePrefersReducedMotion } from '@/lib/hooks';
import { useCustomerStore, useHistoryStore } from '@/lib/local-stores';
import { riseOrder, spring } from '@/lib/motion';
import { useOrderHistoryQuery } from '@/lib/queries';
import { skyThemeColor } from '@/lib/sky';
import { SkyCanvas } from './sky-canvas';
import { StoreStatusPill } from './store-status';

// Header Home dengan langit yang mengikuti jam WIB: pagi 06–14, sore 14–18, malam 18–06.
// Teks & elemen tiap suasana dirender semua lalu dipilih lewat html[data-daypart] (lihat
// globals.css). Atribut itu dipasang sebelum paint di layout.tsx, jadi tidak ada kedipan
// suasana yang salah dan tidak ada hydration mismatch; di sini cukup diperbarui tiap 30 detik.

const SYNC_INTERVAL_MS = 30_000;

/** Lampu bohlam teras: dua lengkungan kabel dari tepi atas header. */
const LAMP_ANCHOR_Y = 6;
const LAMP_SAG = 20;
const BULBS_PER_SWAG = 5;

const BIRDS = [
  { top: 14, width: 17 },
  { top: 30, width: 12 },
  { top: 22, width: 14 },
];

/** `skyBehindStatusBar` false saat bar cari menempel di atas: bar status kembali terang. */
function useDaypartSync(skyBehindStatusBar: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const originalTheme = meta?.content;

    const sync = () => {
      const hour = currentWibHour();
      root.dataset.daypart = daypartFromHour(hour);
      // Bar status ikut warna langit, tapi baru setelah splash selesai agar tidak bentrok.
      if (!meta || root.dataset.splash !== 'done') return;
      if (skyBehindStatusBar) meta.content = skyThemeColor(hour);
      else if (originalTheme) meta.content = originalTheme;
    };

    sync();
    const timer = setInterval(sync, SYNC_INTERVAL_MS);
    const splashObserver = new MutationObserver(sync);
    splashObserver.observe(root, { attributes: true, attributeFilter: ['data-splash'] });
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      splashObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      if (meta && originalTheme) meta.content = originalTheme;
    };
  }, [skyBehindStatusBar]);
}

/**
 * Header menempel di belakang, wadah konten (`sheetRef`) naik menutupinya saat di-scroll.
 * `progress` 0 → 1 = seberapa tertutup header; dipakai untuk memudarkan isi header.
 */
function useSheetCover(
  heroRef: RefObject<HTMLElement | null>,
  searchRef: RefObject<HTMLElement | null>,
  sheetRef: RefObject<HTMLElement | null>,
) {
  const progress = useMotionValue(0);
  const [searchCovered, setSearchCovered] = useState(false);
  const [fullyCovered, setFullyCovered] = useState(false);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const hero = heroRef.current?.getBoundingClientRect();
      const search = searchRef.current?.getBoundingClientRect();
      const sheet = sheetRef.current?.getBoundingClientRect();
      if (!hero || !search || !sheet) return;
      progress.set(Math.min(1, Math.max(0, (hero.bottom - sheet.top) / hero.height)));
      setSearchCovered(sheet.top < search.bottom);
      setFullyCovered(sheet.top <= hero.top + 1);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [heroRef, searchRef, sheetRef, progress]);

  return { progress, searchCovered, fullyCovered };
}

/** Bar cari yang menempel di atas setelah kolom cari di header tertutup wadah konten. */
function StickySearch({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="sticky-search"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={spring.snappy}
          className="fixed inset-x-0 top-0 z-30 glass px-4 pt-[calc(env(safe-area-inset-top)+8px)] pb-2.5 hairline-b lg:hidden"
        >
          <Link
            href="/menu?cari=1"
            className="flex h-11 tap-scale items-center gap-2.5 rounded-full bg-fill px-4 text-body text-label-2"
          >
            <Search size={18} aria-hidden="true" />
            Cari bakso, seblak, es teh…
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Tiga varian teks ditumpuk; CSS menampilkan yang sesuai suasana. Hanya varian yang tampil
 * yang mengambil tempat (lihat .daypart-stack), jadi tinggi judul mengikuti teks yang terlihat.
 */
function DaypartText({
  morning,
  afternoon,
  night,
}: {
  morning: ReactNode;
  afternoon: ReactNode;
  night: ReactNode;
}) {
  return (
    <span className="daypart-stack">
      <span className="daypart-morning">{morning}</span>
      <span className="daypart-afternoon">{afternoon}</span>
      <span className="daypart-night">{night}</span>
    </span>
  );
}

function TerraceLights({ dim }: { dim: boolean }) {
  const bulbs = [0, 1].flatMap((swag) =>
    Array.from({ length: BULBS_PER_SWAG }, (_, index) => {
      const t = (index + 0.5) / BULBS_PER_SWAG;
      return { left: (swag + t) * 50, top: LAMP_ANCHOR_Y + LAMP_SAG * 4 * t * (1 - t) };
    }),
  );
  const wire = `M0 ${LAMP_ANCHOR_Y} Q25 ${LAMP_ANCHOR_Y + LAMP_SAG * 2} 50 ${LAMP_ANCHOR_Y} Q75 ${
    LAMP_ANCHOR_Y + LAMP_SAG * 2
  } 100 ${LAMP_ANCHOR_Y}`;

  return (
    <div
      className="daypart-night pointer-events-none absolute inset-x-0 top-[env(safe-area-inset-top)] h-12 lg:top-1"
      aria-hidden="true"
    >
      <div className="hero-lamps absolute inset-0">
        <svg
          className="absolute inset-0 size-full overflow-visible"
          viewBox="0 0 100 48"
          preserveAspectRatio="none"
        >
          <path
            d={wire}
            fill="none"
            stroke="rgb(255 214 150 / 0.3)"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {bulbs.map((bulb, index) => (
          <span
            key={index}
            className={cn('hero-bulb', dim && 'is-dim')}
            style={{ left: `${bulb.left}%`, top: bulb.top, '--i': index } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function Birds() {
  return (
    <div
      className="daypart-day pointer-events-none absolute inset-x-0 top-[18%] h-16"
      aria-hidden="true"
    >
      {BIRDS.map((bird, index) => (
        <span
          key={index}
          className="hero-bird"
          style={{ top: bird.top, '--i': index } as CSSProperties}
        >
          <svg viewBox="0 0 24 10" width={bird.width} className="hero-bird-wings">
            <path
              d="M1 6.5Q6 0.5 12 6.5Q18 0.5 23 6.5"
              fill="none"
              stroke="rgb(20 32 56 / 0.55)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}

function ShootingStar() {
  return (
    <div
      className="daypart-night pointer-events-none absolute top-[16%] right-[14%]"
      aria-hidden="true"
    >
      <span className="hero-shooting-star" />
    </div>
  );
}

function HeroHistoryButton() {
  const hydrated = useHydrated();
  const entries = useHistoryStore((state) => state.entries);
  const tokens = hydrated ? entries.map((entry) => entry.token) : [];
  const { data } = useOrderHistoryQuery(tokens);
  const hasActiveOrder = data?.orders.some((order) => !isFinalStatus(order.status)) ?? false;

  return (
    <Link
      href="/riwayat"
      aria-label={hasActiveOrder ? 'Riwayat pesanan, ada pesanan berjalan' : 'Riwayat pesanan'}
      className="relative flex size-11 shrink-0 tap-scale items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-xl"
    >
      <History size={22} aria-hidden="true" />
      <AnimatePresence>
        {hasActiveOrder && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-1.5 right-1.5 size-2.5 animate-pulse-dot rounded-full bg-orange ring-2 ring-white/90"
          />
        )}
      </AnimatePresence>
    </Link>
  );
}

function GlassChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1.5 text-footnote font-semibold text-white ring-1 ring-white/25 backdrop-blur-md">
      {icon}
      {children}
    </span>
  );
}

/** Nama depan pembeli dari pesanan sebelumnya di HP ini, atau "Kak". */
function useGreetingName(): string {
  const hydrated = useHydrated();
  const fullName = useCustomerStore((state) => state.profile?.name);
  const firstName = fullName?.trim().split(/\s+/)[0]?.slice(0, 14);
  return (hydrated && firstName) || 'Kak';
}

/** Seberapa jauh wadah konten Home naik menutupi bawah langit (lihat home-view.tsx). */
export const HERO_SHEET_OVERLAP_CLASS = '-mt-7 lg:-mt-10';

export function HomeHero({
  store,
  sheetRef,
}: {
  store: StoreDto;
  /** Wadah konten di bawah header; header menempel dan wadah ini menutupinya saat di-scroll. */
  sheetRef: RefObject<HTMLElement | null>;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLAnchorElement>(null);
  const { progress, searchCovered, fullyCovered } = useSheetCover(heroRef, searchRef, sheetRef);
  useDaypartSync(!searchCovered);
  const reduceMotion = usePrefersReducedMotion();
  // Isi header memudar, sedikit terangkat & mengecil, dan langit meredup saat tertutup.
  const contentOpacity = useTransform(progress, [0.12, 0.55], [1, 0]);
  const contentY = useTransform(progress, [0, 1], [0, -48]);
  const contentScale = useTransform(progress, [0, 1], [1, 0.94]);
  const dimOpacity = useTransform(progress, [0.1, 1], [0, 0.5]);
  const name = useGreetingName();
  const greeting = (word: string) => (
    <>
      Selamat {word},{' '}
      <span key={name} className="animate-page-in">
        {name}
      </span>
    </>
  );

  return (
    <>
      <section
        ref={heroRef}
        aria-label="Sambutan"
        className="sticky top-0 isolate z-0 overflow-hidden text-white lg:top-16 lg:rounded-t-[28px]"
      >
        <div className="sky-fallback absolute inset-0" aria-hidden="true" />
        <SkyCanvas className="absolute inset-0 size-full" paused={fullyCovered} />
        {/* Scrim tipis agar teks putih tetap terbaca di atas awan terang. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/5 to-black/15 lg:bg-gradient-to-r lg:from-black/30 lg:via-black/5 lg:to-transparent"
          aria-hidden="true"
        />
        <Birds />
        <ShootingStar />
        <TerraceLights dim={!store.status.isOpen} />

        {/* Padding bawah = jarak + bagian yang ditutupi wadah konten (HERO_SHEET_OVERLAP_CLASS). */}
        <motion.div
          className="relative flex origin-top flex-col gap-4 px-4 pt-[calc(env(safe-area-inset-top)+40px)] pb-14 lg:max-w-xl lg:px-10 lg:pt-16 lg:pb-[72px]"
          style={
            reduceMotion
              ? { opacity: contentOpacity }
              : { opacity: contentOpacity, y: contentY, scale: contentScale }
          }
        >
          <div
            className="flex animate-rise items-center justify-between gap-3 lg:hidden"
            style={riseOrder(0)}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <LogoMark size={36} className="shrink-0 drop-shadow-[0_4px_10px_rgb(0_0_0/0.25)]" />
              <span className="truncate font-rounded text-headline font-semibold text-shadow-sky">
                Warung Teras Rumah
              </span>
            </span>
            <HeroHistoryButton />
          </div>

          <div className="animate-rise" style={riseOrder(1)}>
            <p className="text-subhead font-medium text-white/90 text-shadow-sky">
              <DaypartText
                morning={greeting('pagi')}
                afternoon={greeting('sore')}
                night={greeting('malam')}
              />
            </p>
            <h1 className="mt-1 text-title-1 font-bold text-balance text-shadow-sky lg:text-large-title">
              <DaypartText
                morning="Mau sarapan apa hari ini?"
                afternoon="Ngemil sore apa enaknya?"
                night="Mau makan malam apa?"
              />
            </h1>
          </div>

          <div className="animate-rise" style={riseOrder(2)}>
            <StoreStatusPill status={store.status} tone="glass" />
          </div>

          <Link
            ref={searchRef}
            href="/menu?cari=1"
            className="flex h-12 tap-scale animate-rise items-center gap-2.5 rounded-full glass-strong px-4 text-body text-label-2"
            style={riseOrder(3)}
          >
            <Search size={18} aria-hidden="true" />
            Cari bakso, seblak, es teh…
          </Link>

          <div className="flex animate-rise flex-wrap gap-2" style={riseOrder(4)}>
            <GlassChip icon={<Bike size={16} aria-hidden="true" />}>Gratis ongkir</GlassChip>
            <GlassChip icon={<Armchair size={16} aria-hidden="true" />}>
              Bisa makan di tempat
            </GlassChip>
          </div>
        </motion.div>

        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          style={{ opacity: dimOpacity }}
          aria-hidden="true"
        />
      </section>
      {/* Di luar <section> karena section memakai isolate (stacking context sendiri). */}
      <StickySearch visible={searchCovered} />
    </>
  );
}
