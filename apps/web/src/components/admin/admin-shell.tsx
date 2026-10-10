'use client';

import { formatRupiah } from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { Logo } from '@/components/brand/logo';
import { WarungLoader } from '@/components/brand/warung-loader';
import { ChartColumn, ChevronRight, ClipboardList, Settings, Utensils, Volume2, X, type LucideIcon } from '@/components/ui/icons';
import { LinkPending } from '@/components/ui/link-pending';
import { Toaster } from '@/components/ui/toaster';
import { useAdminMe, useAdminOrders, useAdminSettings } from '@/lib/admin-api';
import { enableSound, isSoundPreferred, isSoundReady, playChime, subscribeSound } from '@/lib/admin-sound';
import { useAdminLocal, useAdminUi } from '@/lib/admin-store';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useUiStore } from '@/lib/ui-store';
import { useAdminEvents } from './use-admin-events';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  { href: '/admin', label: 'Pesanan', icon: ClipboardList, match: (p) => p === '/admin' || p.startsWith('/admin/pesanan') },
  { href: '/admin/menu', label: 'Menu', icon: Utensils, match: (p) => p.startsWith('/admin/menu') },
  { href: '/admin/laporan', label: 'Laporan', icon: ChartColumn, match: (p) => p.startsWith('/admin/laporan') },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings, match: (p) => p.startsWith('/admin/pengaturan') },
];

const REPEAT_SOUND_MS = 30_000;

function NeedsActionBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-3 min-w-[18px] rounded-full bg-tint px-1 text-center text-caption leading-[18px] font-bold text-white ring-2 ring-white">
      {count > 9 ? '9+' : count}
    </span>
  );
}

function SoundPrompt() {
  const ready = useSyncExternalStore(subscribeSound, isSoundReady, () => true);
  const preferred = useSyncExternalStore(subscribeSound, isSoundPreferred, () => true);
  if (ready || !preferred) return null;
  return (
    <button
      type="button"
      onClick={() => void enableSound().then((ok) => ok && playChime(1))}
      className="tap flex w-full items-center gap-3 bg-orange-soft px-4 py-3 text-left text-orange-text"
    >
      <Volume2 size={20} aria-hidden="true" />
      <span className="flex-1 text-subhead font-semibold">Aktifkan Suara agar bunyi saat ada pesanan baru</span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  );
}

function IncomingBanner() {
  const incoming = useAdminUi((state) => state.incoming);
  const setIncoming = useAdminUi((state) => state.setIncoming);

  useEffect(() => {
    if (!incoming) return;
    const timer = setTimeout(() => setIncoming(null), 20_000);
    return () => clearTimeout(timer);
  }, [incoming, setIncoming]);

  return (
    <AnimatePresence>
      {incoming && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+8px)] z-[65] flex justify-center px-3"
          role="alert"
        >
          <div className="glass-strong flex w-full max-w-md items-center gap-2 rounded-[22px] p-1.5 pl-4">
            <Link
              href={`/admin/pesanan/${incoming.id}`}
              onClick={() => setIncoming(null)}
              className="tap flex min-w-0 flex-1 flex-col py-1"
            >
              <span className="text-headline text-tint">Pesanan baru!</span>
              <span className="truncate text-subhead text-label">
                #{incoming.code} · {formatRupiah(incoming.total)}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIncoming(null)}
              aria-label="Tutup"
              className="tap flex size-10 items-center justify-center rounded-full bg-fill text-label-2"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Kerangka dashboard: tab bar (HP), sidebar 240 px (desktop), SSE, bunyi berulang. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useAdminMe();
  const authed = me.isSuccess;
  const needsAction = useAdminOrders('NEEDS_ACTION');
  const settings = useAdminSettings();
  const seenOrderIds = useAdminLocal((state) => state.seenOrderIds);
  const overlays = useUiStore((state) => state.overlays);

  useAdminEvents();

  // Sesi habis di request mana pun → kembali ke halaman login.
  useEffect(() => {
    const redirect = () => router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    if (me.error instanceof ApiError && me.error.status === 401) redirect();
    return queryClient.getQueryCache().subscribe((event) => {
      const error = event.query.state.error;
      if (event.query.queryKey[0] === 'admin' && error instanceof ApiError && error.status === 401) redirect();
    });
  }, [me.error, pathname, queryClient, router]);

  // Bunyi berulang tiap 30 detik selama ada pesanan Menunggu Konfirmasi yang belum dibuka.
  const unseen = (needsAction.data?.orders ?? []).filter((order) => !seenOrderIds.includes(order.id)).length;
  const soundRepeat = settings.data?.soundRepeat ?? true;
  useEffect(() => {
    if (!soundRepeat || unseen === 0) return;
    const timer = setInterval(() => playChime(), REPEAT_SOUND_MS);
    return () => clearInterval(timer);
  }, [soundRepeat, unseen]);

  if (!authed) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <WarungLoader topic="admin" />
      </div>
    );
  }

  const badge = needsAction.data?.summary.needsAction ?? 0;

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-separator bg-surface/70 px-3 py-6 lg:flex">
        <div className="px-3">
          <Logo compact size={30} />
          <p className="mt-1 text-footnote text-label-2">Dashboard pemilik</p>
        </div>
        <nav aria-label="Navigasi admin" className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'tap-row relative flex h-11 items-center gap-3 rounded-control px-3 text-body',
                  active ? 'bg-tint-soft font-semibold text-tint-pressed' : 'text-label',
                )}
              >
                <LinkPending className="rounded-control" />
                <span className="relative">
                  <Icon size={22} aria-hidden="true" />
                  {item.href === '/admin' && <NeedsActionBadge count={badge} />}
                </span>
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <SoundPrompt />
        <main className="pb-[calc(max(12px,env(safe-area-inset-bottom))+96px)] lg:pb-12">{children}</main>
      </div>

      <nav
        aria-label="Navigasi admin"
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] transition-transform duration-300 ease-ios lg:hidden',
          overlays > 0 && 'pointer-events-none translate-y-[150%]',
        )}
      >
        <div className="glass-strong flex h-16 w-full max-w-[460px] items-center rounded-full p-1.5">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-caption font-semibold',
                  active ? 'text-tint' : 'text-label-2',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab-pill"
                    className="absolute inset-0 rounded-full bg-black/[0.06]"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <LinkPending />
                <span className="relative">
                  <Icon size={24} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                  {item.href === '/admin' && <NeedsActionBadge count={badge} />}
                </span>
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <IncomingBanner />
      <Toaster className="bottom-[calc(max(12px,env(safe-area-inset-bottom))+96px)] lg:bottom-8" />
    </div>
  );
}
