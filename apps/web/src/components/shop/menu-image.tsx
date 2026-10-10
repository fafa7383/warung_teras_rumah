'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FoodArt } from '@/components/brand/food-art';
import { cn } from '@/lib/cn';

/**
 * Foto menu dengan cadangan ilustrasi mangkok sesuai kategori
 * saat foto belum ada atau gagal dimuat (PRD 3.4).
 */
export function MenuImage({
  src,
  alt,
  categorySlug,
  sizes,
  className,
  grayscale,
  priority,
}: {
  src: string | null;
  alt: string;
  categorySlug: string;
  sizes: string;
  className?: string;
  grayscale?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex size-full items-center justify-center bg-[#F5F5F7]',
          grayscale && 'grayscale',
          className,
        )}
      >
        {/* Persegi 62% lebar, tapi tidak lebih tinggi dari 80% kotak agar tidak terpotong di foto 16:9. */}
        <FoodArt kind={categorySlug} className="aspect-square h-auto max-h-[80%] w-[62%]" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.endsWith('.svg')}
      onError={() => setFailed(true)}
      className={cn('object-cover', grayscale && 'grayscale', className)}
    />
  );
}
