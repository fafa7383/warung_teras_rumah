'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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

/** Navigation bar iOS: transparan di atas, menjadi kaca + garis tipis saat konten di-scroll. */
export function PageHeader({ title, largeTitle = true, leading, trailing, children, className }: PageHeaderProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting), {
      rootMargin: '-60px 0px 0px 0px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const showInlineTitle = !largeTitle || scrolled;

  return (
    <>
      <div
        className={cn(
          'sticky top-0 z-30 transition-[background-color,box-shadow,backdrop-filter] duration-200 lg:static lg:bg-transparent lg:shadow-none lg:backdrop-blur-none',
          scrolled ? 'glass hairline-b' : 'bg-transparent',
          className,
        )}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-bar max-w-content items-center gap-2 px-4">
          <div className="flex min-w-11 flex-1 items-center gap-2">{leading}</div>
          <p
            className={cn(
              'min-w-0 shrink truncate text-center text-headline transition-opacity duration-200',
              showInlineTitle ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden={largeTitle || undefined}
          >
            {title}
          </p>
          <div className="flex min-w-11 flex-1 items-center justify-end gap-2">{trailing}</div>
        </div>
      </div>
      <div ref={sentinelRef} className={cn('mx-auto max-w-content px-4', largeTitle ? 'pb-3' : 'h-0')}>
        {largeTitle ? <h1 className="text-large-title font-bold">{title}</h1> : <h1 className="sr-only">{title}</h1>}
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
