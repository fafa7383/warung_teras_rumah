'use client';

import { formatRupiah } from '@wtr/shared';
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';

/** Harga yang "menghitung" halus ke nilai baru saat opsi/jumlah berubah. */
export function AnimatedRupiah({ value, className }: { value: number; className?: string }) {
  const reduceMotion = useReducedMotion();
  const animated = useSpring(value, { stiffness: 210, damping: 30, mass: 0.8 });
  const text = useTransform(animated, (current) => formatRupiah(Math.round(current)));

  useEffect(() => {
    if (reduceMotion) animated.jump(value);
    else animated.set(value);
  }, [animated, reduceMotion, value]);

  return <motion.span className={cn('tabular-nums', className)}>{text}</motion.span>;
}

/** Angka kecil (badge, jumlah) yang bergulir naik/turun saat berubah. */
export function RollingNumber({
  value,
  direction = 1,
  className,
}: {
  value: number | string;
  /** 1 = angka baru datang dari bawah (bertambah), -1 = dari atas (berkurang). */
  direction?: 1 | -1;
  className?: string;
}) {
  return (
    <span className={cn('relative inline-flex overflow-hidden tabular-nums', className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.span
          key={String(value)}
          custom={direction}
          variants={{
            enter: (d: number) => ({ y: d > 0 ? '70%' : '-70%', opacity: 0 }),
            center: { y: '0%', opacity: 1 },
            exit: (d: number) => ({ y: d > 0 ? '-70%' : '70%', opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 520, damping: 32 }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
