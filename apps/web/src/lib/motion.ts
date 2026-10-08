import type { Transition, Variants } from 'motion/react';
import type { CSSProperties } from 'react';

/**
 * Preset gerak bersama. Semua interaksi memakai pegas (spring) agar terasa hidup seperti iOS:
 * - snappy: tap, toggle, centang
 * - smooth: sheet, kartu, perpindahan posisi
 * - gentle: konten besar yang masuk
 * - bouncy: badge & perayaan
 */
export const spring = {
  snappy: { type: 'spring', stiffness: 560, damping: 34, mass: 0.7 },
  smooth: { type: 'spring', stiffness: 340, damping: 32, mass: 0.9 },
  gentle: { type: 'spring', stiffness: 190, damping: 24 },
  bouncy: { type: 'spring', stiffness: 520, damping: 16, mass: 0.7 },
} satisfies Record<string, Transition>;

export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
};

export const staggerChildren = (gap = 0.05, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Untuk style={{ '--i': n }} pada utilitas animate-rise. */
export const riseOrder = (index: number) => ({ '--i': index }) as CSSProperties;
