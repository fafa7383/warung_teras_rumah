'use client';

import type { BannerDto } from '@wtr/shared';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/lib/hooks';

const AUTOPLAY_MS = 4000;
const RESUME_AFTER_TOUCH_MS = 6000;

function bannerHref(banner: BannerDto): string | null {
  if (!banner.targetSlug) return null;
  if (banner.targetType === 'CATEGORY') return `/menu?kategori=${banner.targetSlug}`;
  if (banner.targetType === 'MENU') return `/menu/${banner.targetSlug}`;
  return null;
}

/** Banner 2:1, geser otomatis tiap 4 detik, bisa di-swipe, indikator titik (PRD 6.1). */
export function BannerCarousel({ banners }: { banners: BannerDto[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const [active, setActive] = useState(0);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track || Date.now() < pausedUntil.current || document.hidden) return;
      const width = track.clientWidth;
      const next = (Math.round(track.scrollLeft / width) + 1) % banners.length;
      track.scrollTo({ left: next * width, behavior: reduceMotion ? 'auto' : 'smooth' });
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, reduceMotion]);

  if (banners.length === 0) return null;

  return (
    <section aria-label="Promo" aria-roledescription="carousel">
      <div
        ref={trackRef}
        onScroll={(event) => {
          const track = event.currentTarget;
          setActive(Math.round(track.scrollLeft / Math.max(1, track.clientWidth)));
        }}
        onPointerDown={() => {
          pausedUntil.current = Date.now() + RESUME_AFTER_TOUCH_MS;
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-card"
      >
        {banners.map((banner, index) => {
          const href = bannerHref(banner);
          const image = (
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              sizes="(min-width: 1024px) 800px, 100vw"
              priority={index === 0}
              unoptimized={banner.imageUrl.endsWith('.svg')}
              className="object-cover"
            />
          );
          return (
            <div
              key={banner.id}
              className="relative aspect-[2/1] w-full shrink-0 snap-center overflow-hidden rounded-card bg-fill"
              aria-roledescription="slide"
              aria-label={`${index + 1} dari ${banners.length}: ${banner.title}`}
            >
              {href ? (
                <Link href={href} className="tap absolute inset-0">
                  {image}
                </Link>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
      {banners.length > 1 && (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden="true">
          {banners.map((banner, index) => (
            <span
              key={banner.id}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                index === active ? 'w-4 bg-label' : 'w-1.5 bg-label-3',
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
