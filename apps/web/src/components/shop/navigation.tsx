'use client';

import { formatRupiah } from '@wtr/shared';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { ChevronRight, History, House, ShoppingBag, Utensils, type LucideIcon } from '@/components/ui/icons';
import { cartTotals, useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/cn';
import { useHydrated } from '@/lib/hooks';
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
  { href: '/keranjang', label: 'Keranjang', icon: ShoppingBag, match: (p) => p.startsWith('/keranjang'), cart: true },
];

function useCartCount() {
  const hydrated = useHydrated();
  const lines = useCartStore((state) => state.lines);
  return hydrated ? cartTotals(lines) : { count: 0, subtotal: 0 };
}

function CartBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-3 min-w-[18px] rounded-full bg-tint px-1 text-center text-caption leading-[18px] font-bold text-white ring-2 ring-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

/** Tab bar kaca mengambang ala iOS (HP & tablet < 1024 px, PRD 4.3). */
export function TabBar() {
  const pathname = usePathname();
  const overlays = useUiStore((state) => state.overlays);
  const bump = useUiStore((state) => state.cartBump);
  const { count } = useCartCount();

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-ios lg:hidden',
        overlays > 0 && 'pointer-events-none translate-y-[150%]',
      )}
    >
      <div className="glass-strong flex h-16 w-full max-w-[420px] items-center rounded-full p-1.5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-caption font-semibold transition-colors duration-150',
                active ? 'text-tint' : 'text-label-2',
              )}
            >
              {active && (
                <motion.span
                  layoutId="buyer-tab-pill"
                  className="absolute inset-0 rounded-full bg-black/[0.06]"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span
                key={tab.cart ? `bump-${bump}` : undefined}
                className={cn('relative', tab.cart && bump > 0 && 'animate-bounce-once')}
              >
                <Icon size={24} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                {tab.cart && <CartBadge count={count} />}
              </span>
              <span className="relative">{tab.label}</span>
              {tab.cart && count > 0 && <span className="sr-only">, {count} item</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Top nav desktop ≥ 1024 px: logo kiri, menu tengah, keranjang kanan (PRD 4.4). */
export function TopNav() {
  const pathname = usePathname();
  const bump = useUiStore((state) => state.cartBump);
  const { count } = useCartCount();
  const links = [
    { href: '/', label: 'Home', active: pathname === '/' },
    { href: '/menu', label: 'Menu', active: pathname.startsWith('/menu') },
    { href: '/riwayat', label: 'Riwayat', active: pathname.startsWith('/riwayat') },
  ];

  return (
    <header className="glass hairline-b sticky top-0 z-40 hidden lg:block">
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
                'tap rounded-full px-4 py-1.5 text-subhead font-semibold',
                link.active ? 'bg-white text-label shadow-[0_2px_6px_rgb(0_0_0/0.08)]' : 'text-label-2',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 justify-end">
          <Link
            href="/keranjang"
            aria-label={`Keranjang, ${count} item`}
            className="tap relative flex size-11 items-center justify-center rounded-full bg-fill text-label"
          >
            <span key={`bump-${bump}`} className={cn('relative', bump > 0 && 'animate-bounce-once')}>
              <ShoppingBag size={22} aria-hidden="true" />
              <CartBadge count={count} />
            </span>
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
    <div
      className={cn(
        'fixed inset-x-0 z-30 flex justify-center px-4 transition-all duration-300 ease-ios xl:hidden',
        'bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] lg:bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
      aria-hidden={!visible}
    >
      <Link
        href="/keranjang"
        tabIndex={visible ? undefined : -1}
        className="tap flex h-14 w-full max-w-[420px] items-center gap-3 rounded-full bg-tint pr-2 pl-5 text-white shadow-[0_10px_30px_rgb(214_60_60/0.35)]"
      >
        <ShoppingBag size={20} aria-hidden="true" />
        <span className="flex-1 text-left text-subhead font-semibold">
          {count} item · {formatRupiah(subtotal)}
        </span>
        <span className="flex items-center gap-0.5 rounded-full bg-white/20 py-2 pr-2.5 pl-3.5 text-footnote font-semibold">
          Lihat Keranjang
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      </Link>
    </div>
  );
}

/** Ikon riwayat di header Home (PRD 6.1). */
export function HistoryLink() {
  return (
    <Link
      href="/riwayat"
      aria-label="Riwayat pesanan"
      className="tap glass-strong flex size-11 items-center justify-center rounded-full text-label lg:hidden"
    >
      <History size={22} aria-hidden="true" />
    </Link>
  );
}
