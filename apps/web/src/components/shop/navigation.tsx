'use client';

import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/brand/logo';
import { AnimatedRupiah, RollingNumber } from '@/components/motion/animated-number';
import { useCartTarget } from '@/components/motion/fly-to-cart';
import { ChevronRight, House, ShoppingBag, Utensils, type LucideIcon } from '@/components/ui/icons';
import { cartTotals, useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks';
import { spring } from '@/lib/motion';
import { useUiStore } from '@/lib/ui-store';

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  cart?: boolean;
}

const TABS: Tab[] = [
  { href: '/', label: 'Home', icon: House, match: (p) => p === '/' },
  { href: '/menu', label: 'Menu', icon: Utensils, match: (p) => p.startsWith('/menu') },
  {
    href: '/keranjang',
    label: 'Keranjang',
    icon: ShoppingBag,
    match: (p) => p.startsWith('/keranjang'),
    cart: true,
  },
];

function useCartCount() {
  const hydrated = useHydrated();
  const lines = useCartStore((state) => state.lines);
  return hydrated ? cartTotals(lines) : { count: 0, subtotal: 0 };
}

/** Badge jumlah keranjang: muncul dengan pegas, angkanya bergulir saat berubah. */
function CartBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key="badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={spring.bouncy}
          className="absolute -top-1.5 -right-3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tint px-1 text-caption leading-none font-bold text-white ring-2 ring-white"
        >
          <RollingNumber value={count > 9 ? '9+' : count} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Ikon keranjang yang memantul setiap ada menu tiba (tujuan animasi "terbang"). */
function CartIcon({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  const bump = useUiStore((state) => state.cartBump);
  const controls = useAnimationControls();
  const targetRef = useCartTarget();
  const { count } = useCartCount();

  useEffect(() => {
    if (bump === 0) return;
    void controls.start({
      scale: [1, 1.38, 0.9, 1.06, 1],
      rotate: [0, -14, 10, -4, 0],
      transition: { duration: 0.6, ease: 'easeOut' },
    });
  }, [bump, controls]);

  return (
    <motion.span ref={targetRef} animate={controls} className="relative inline-flex">
      <ShoppingBag size={size} strokeWidth={strokeWidth} aria-hidden="true" />
      <CartBadge count={count} />
    </motion.span>
  );
}

/** Tab bar kaca mengambang ala iOS (HP & tablet < 1024 px, PRD 4.3). */
export function TabBar() {
  const pathname = usePathname();
  const overlays = useUiStore((state) => state.overlays);
  const { count } = useCartCount();
  const hidden = overlays > 0;

  return (
    <motion.nav
      aria-label="Navigasi utama"
      initial={false}
      animate={{ y: hidden ? 140 : 0, opacity: hidden ? 0 : 1 }}
      transition={spring.smooth}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden',
        hidden && 'pointer-events-none',
      )}
    >
      <div className="flex h-16 w-full max-w-[420px] items-center rounded-full glass-strong p-1.5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-caption font-semibold transition-colors duration-200',
                active ? 'text-tint' : 'text-label-2',
              )}
            >
              {active && (
                <motion.span
                  layoutId="buyer-tab-pill"
                  className="absolute inset-0 rounded-full bg-black/[0.06]"
                  transition={spring.smooth}
                />
              )}
              <motion.span
                whileTap={{ scale: 0.82 }}
                transition={spring.snappy}
                className="relative inline-flex"
              >
                {tab.cart ? (
                  <CartIcon size={24} strokeWidth={active ? 2.4 : 2} />
                ) : (
                  <motion.span
                    animate={active ? { y: [0, -3, 0] } : { y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="inline-flex"
                  >
                    <Icon size={24} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                  </motion.span>
                )}
              </motion.span>
              <span className="relative">{tab.label}</span>
              {tab.cart && count > 0 && <span className="sr-only">, {count} item</span>}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}

/** Top nav desktop ≥ 1024 px: logo kiri, menu tengah, keranjang kanan (PRD 4.4). */
export function TopNav() {
  const pathname = usePathname();
  const { count } = useCartCount();
  const links = [
    { href: '/', label: 'Home', active: pathname === '/' },
    { href: '/menu', label: 'Menu', active: pathname.startsWith('/menu') },
    { href: '/riwayat', label: 'Riwayat', active: pathname.startsWith('/riwayat') },
  ];

  return (
    <header className="sticky top-0 z-40 hidden glass hairline-b lg:block">
      <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-6">
        <Link href="/" className="flex-1">
          <Logo compact size={30} />
        </Link>
        <nav aria-label="Navigasi utama" className="flex rounded-full bg-fill p-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={link.active ? 'page' : undefined}
              className={cn(
                'relative rounded-full px-4 py-1.5 text-subhead font-semibold transition-colors duration-200',
                link.active ? 'text-label' : 'text-label-2 hover:text-label',
              )}
            >
              {link.active && (
                <motion.span
                  layoutId="desktop-nav-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.08)]"
                  transition={spring.smooth}
                />
              )}
              <span className="relative">{link.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 justify-end">
          <Link
            href="/keranjang"
            aria-label={`Keranjang, ${count} item`}
            className="relative flex size-11 tap-scale items-center justify-center rounded-full bg-fill text-label"
          >
            <CartIcon size={22} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/** "2 item · Rp30.000 · Lihat Keranjang" di atas tab bar (PRD 4.3). */
export function CartMiniBar() {
  const pathname = usePathname();
  const overlays = useUiStore((state) => state.overlays);
  const { count, subtotal } = useCartCount();
  const visible = count > 0 && !pathname.startsWith('/keranjang') && overlays === 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-30 flex justify-center px-4 lg:bottom-6 xl:hidden">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="mini-bar"
            initial={{ y: 40, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.94 }}
            transition={spring.smooth}
            className="pointer-events-auto w-full max-w-[420px]"
          >
            <Link
              href="/keranjang"
              className="flex h-14 w-full tap-scale items-center gap-3 rounded-full bg-tint pr-2 pl-5 text-white shadow-[0_6px_18px_rgb(0_0_0/0.14)]"
            >
              <ShoppingBag size={20} aria-hidden="true" />
              <span className="flex flex-1 items-center gap-1 text-left text-subhead font-semibold">
                <RollingNumber value={count} /> item ·
                <AnimatedRupiah value={subtotal} />
              </span>
              <span className="flex items-center gap-0.5 rounded-full bg-white/20 py-2 pr-2.5 pl-3.5 text-footnote font-semibold">
                Lihat Keranjang
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </motion.span>
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
