'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { BowlArt, DrinkArt, Steam, type BowlVariant } from './food-art';

type Dish = BowlVariant | 'minuman';
type Line = readonly [dish: Dish, text: string];

export type LoaderTopic =
  | 'umum'
  | 'menu'
  | 'detail'
  | 'keranjang'
  | 'pesanan'
  | 'riwayat'
  | 'struk'
  | 'admin'
  | 'admin-pesanan'
  | 'admin-menu'
  | 'laporan'
  | 'pengaturan';

/** Kalimat bergantian selama menunggu; tiap kalimat "menyajikan" mangkok yang berbeda. */
const LINES: Record<LoaderTopic, readonly Line[]> = {
  umum: [
    ['bakso', 'Sebentar yah, kuahnya lagi dipanasin…'],
    ['mie-ayam', 'Tunggu dulu, mienya lagi ditiriskan…'],
    ['minuman', 'Bentar, es tehnya lagi diaduk…'],
    ['seblak', 'Sabar yah, kerupuknya lagi direndam…'],
    ['jajanan', 'Abangnya lagi lari ke dapur…'],
  ],
  menu: [
    ['bakso', 'Sebentar yah, menunya lagi ditata…'],
    ['mie-ayam', 'Nyalain kompor dulu, tunggu bentar…'],
    ['seblak', 'Ngecek stok sambel… aman kok!'],
    ['minuman', 'Ngelap gelas dulu biar kinclong…'],
    ['jajanan', 'Gorengannya lagi ditiriskan…'],
  ],
  detail: [
    ['bakso', 'Ngambil mangkok yang paling cakep…'],
    ['mie-ayam', 'Nanya dapur, toppingnya ada apa aja…'],
    ['seblak', 'Sebentar, lagi dicicip dulu…'],
    ['minuman', 'Tunggu yah, lagi disiapin buat kamu…'],
  ],
  keranjang: [
    ['bakso', 'Ngecek ulang biar nggak ada yang ketinggalan…'],
    ['jajanan', 'Ngitung total, kalkulatornya agak seret…'],
    ['minuman', 'Sebentar yah, notanya lagi ditulis…'],
  ],
  pesanan: [
    ['bakso', 'Lagi nanya dapur, pesananmu sampai mana…'],
    ['mie-ayam', 'Ngintip panci sebentar yah…'],
    ['minuman', 'Nyari kertas pesananmu di jepitan…'],
    ['seblak', 'Tunggu bentar, abangnya lagi ngecek…'],
  ],
  riwayat: [
    ['jajanan', 'Bongkar-bongkar catatan jajanmu…'],
    ['bakso', 'Nyari di buku besar warung…'],
    ['minuman', 'Wah, lumayan juga jajannya… bentar yah'],
  ],
  struk: [
    ['jajanan', 'Struknya lagi dicetak, sabar yah…'],
    ['bakso', 'Kertasnya ditarik pelan-pelan…'],
    ['minuman', 'Tintanya lagi ditiup biar cepet kering…'],
  ],
  admin: [
    ['bakso', 'Buka rolling door warung dulu…'],
    ['minuman', 'Nyalain lampu teras…'],
    ['jajanan', 'Nyapu teras sebentar yah…'],
  ],
  'admin-pesanan': [
    ['bakso', 'Ngumpulin kertas pesanan…'],
    ['mie-ayam', 'Ngecek siapa aja yang udah pesan…'],
    ['minuman', 'Pulpennya mana yah… nah, ketemu'],
  ],
  'admin-menu': [
    ['bakso', 'Ngabsen menu satu-satu…'],
    ['seblak', 'Ngecek harga di papan menu…'],
    ['jajanan', 'Ngintip etalase sebentar…'],
  ],
  laporan: [
    ['jajanan', 'Ngitung recehan… eh, omzet maksudnya'],
    ['bakso', 'Kalkulatornya lagi dicari di laci…'],
    ['minuman', 'Nyusun grafik, penggarisnya mana yah…'],
  ],
  pengaturan: [
    ['bakso', 'Buka laci pengaturan dulu…'],
    ['jajanan', 'Nyari obeng sebentar…'],
    ['minuman', 'Ngencengin baut-baut warung…'],
  ],
};

/** Teks tetap untuk pembaca layar (kalimat bergantian tidak diumumkan berulang-ulang). */
const LABELS: Record<LoaderTopic, string> = {
  umum: 'Memuat',
  menu: 'Memuat menu',
  detail: 'Memuat detail menu',
  keranjang: 'Memuat keranjang',
  pesanan: 'Memuat status pesanan',
  riwayat: 'Memuat riwayat pesanan',
  struk: 'Memuat struk',
  admin: 'Membuka dashboard',
  'admin-pesanan': 'Memuat pesanan',
  'admin-menu': 'Memuat menu',
  laporan: 'Menghitung laporan',
  pengaturan: 'Memuat pengaturan',
};

const LINE_MS = 2400;

function DishArt({ dish }: { dish: Dish }) {
  return dish === 'minuman' ? (
    <DrinkArt className="size-full" />
  ) : (
    <BowlArt variant={dish} spoon={false} className="size-full" />
  );
}

/**
 * Loader khas warung untuk setiap proses memuat: mangkok berganti hidangan sambil kalimatnya
 * bergantian. Baru terlihat setelah jeda singkat, jadi data yang datang cepat tidak membuat
 * layar berkedip.
 */
export function WarungLoader({
  topic = 'umum',
  fill = false,
  className,
}: {
  topic?: LoaderTopic;
  /** Mengisi area halaman (loading route), bukan hanya sepotong bagian. */
  fill?: boolean;
  className?: string;
}) {
  const lines = LINES[topic];
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % lines.length), LINE_MS);
    return () => clearInterval(timer);
  }, [lines.length]);

  const [dish, text] = lines[index % lines.length]!;

  return (
    <div
      role="status"
      className={cn(
        'loader-in flex w-full flex-col items-center justify-center px-6 text-center',
        fill ? 'min-h-[62dvh]' : 'py-14',
        className,
      )}
    >
      <span className="sr-only">{LABELS[topic]}…</span>

      <div aria-hidden="true" className="flex flex-col items-center">
        <Steam className="h-7 w-10" />
        <div className="loader-bob relative size-[76px]">
          <AnimatePresence initial={false}>
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.55, y: -14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 6 }}
              transition={
                reduceMotion ? { duration: 0.2 } : { type: 'spring', stiffness: 420, damping: 22, mass: 0.8 }
              }
            >
              <DishArt dish={dish} />
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="loader-shadow mt-1 h-1.5 w-12 rounded-full bg-black/[0.07]" />
      </div>

      <div aria-hidden="true" className="relative mt-4 h-10 w-full max-w-[290px]">
        <AnimatePresence initial={false}>
          <motion.p
            key={index}
            className="absolute inset-x-0 top-0 text-subhead font-medium text-label"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: reduceMotion ? 0.2 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div aria-hidden="true" className="mt-1 flex gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-1.5 animate-pulse-dot rounded-full bg-tint motion-reduce:animate-none"
            style={{ animationDelay: `${dot * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
