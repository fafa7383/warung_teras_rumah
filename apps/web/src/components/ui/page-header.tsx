'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { canGoBack } from '@/lib/nav-history';
import { IconButton } from './button';
import { ChevronLeft } from './icons';

interface PageHeaderProps {
  title: string;
  /** Judul besar 34 px yang mengecil ke bar saat di-scroll (gaya iOS). */
  largeTitle?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Konten di bawah judul besar (mis. teks keterangan). */
  children?: ReactNode;
  className?: string;
}

/**
 * Navigation bar iOS yang mengikuti posisi scroll secara langsung (bukan sekadar berganti status):
 * judul besar memudar & mengecil, judul kecil muncul di bar, latar kaca menebal perlahan.
 * Saat ditarik melewati atas (overscroll), judul besar sedikit membesar seperti di iPhone.
 */
export function PageHeader({ title, largeTitle = true, leading, trailing, children, className }: PageHeaderProps) {
  const { scrollY } = useScroll();
  const barOpacity = useTransform(scrollY, [2, 36], [0, 1]);
  const inlineOpacity = useTransform(scrollY, largeTitle ? [24, 50] : [0, 1], [largeTitle ? 0 : 1, 1]);
  const inlineY = useTransform(scrollY, largeTitle ? [24, 50] : [0, 1], [largeTitle ? 6 : 0, 0]);
  const titleOpacity = useTransform(scrollY, [0, 34], [1, 0]);
  const titleScale = useTransform(scrollY, [-120, 0, 40], [1.1, 1, 0.94]);

  return (
    <>
      <div className={cn('sticky top-0 z-30 lg:static', className)} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <motion.div className="glass hairline-b absolute inset-0 lg:hidden" style={{ opacity: barOpacity }} aria-hidden="true" />
        <div className="relative mx-auto flex h-bar max-w-content items-center gap-2 px-4">
          <div className="flex min-w-11 flex-1 items-center gap-2">{leading}</div>
          <motion.p
            className="min-w-0 shrink truncate text-center text-headline"
            style={{ opacity: inlineOpacity, y: inlineY }}
            aria-hidden={largeTitle || undefined}
          >
            {title}
          </motion.p>
          <div className="flex min-w-11 flex-1 items-center justify-end gap-2">{trailing}</div>
        </div>
      </div>
      <div className={cn('mx-auto max-w-content px-4', largeTitle ? 'pb-3' : 'h-0')}>
        {largeTitle ? (
          <motion.h1
            className="origin-left text-large-title font-bold"
            style={{ opacity: titleOpacity, scale: titleScale }}
          >
            {title}
          </motion.h1>
        ) : (
          <h1 className="sr-only">{title}</h1>
        )}
        {children}
      </div>
    </>
  );
}

/** Tombol kembali bundar; jatuh ke `fallbackHref` bila halaman dibuka langsung dari link. */
export function BackButton({ fallbackHref = '/', label = 'Kembali' }: { fallbackHref?: string; label?: string }) {
  const router = useRouter();
  return (
    <IconButton
      label={label}
      onClick={() => (canGoBack() ? router.back() : router.push(fallbackHref))}
    >
      <ChevronLeft size={24} strokeWidth={2.4} className="-ml-0.5" aria-hidden="true" />
    </IconButton>
  );
}
