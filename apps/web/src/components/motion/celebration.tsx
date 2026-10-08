'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

const CONFETTI_COLORS = ['#E14B4B', '#F6B94A', '#34C759', '#007AFF', '#FF9500', '#FFD9C4', '#5856D6'];

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  rotate: number;
  round: boolean;
  delay: number;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    angle: (Math.PI * 2 * id) / count + (Math.random() - 0.5) * 0.6,
    distance: 90 + Math.random() * 110,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[id % CONFETTI_COLORS.length] ?? '#E14B4B',
    rotate: (Math.random() - 0.5) * 540,
    round: Math.random() > 0.55,
    delay: Math.random() * 0.12,
  }));
}

/** Ledakan confetti dari titik tengah elemen induk (induk harus relative). */
export function ConfettiBurst({ count = 30, className }: { count?: number; className?: string }) {
  const [particles] = useState(() => makeParticles(count));
  return (
    <div className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)} aria-hidden="true">
      {particles.map((p) => {
        const x = Math.cos(p.angle) * p.distance;
        const y = Math.sin(p.angle) * p.distance;
        return (
          <motion.span
            key={p.id}
            className={cn('absolute', p.round ? 'rounded-full' : 'rounded-[2px]')}
            style={{ width: p.size, height: p.round ? p.size : p.size * 0.5, backgroundColor: p.color }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{
              x: [0, x * 0.9, x],
              // Naik lalu jatuh pelan karena "gravitasi".
              y: [0, y * 0.9, y + 70],
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 0.9],
              rotate: p.rotate,
            }}
            transition={{ duration: 1.5, delay: p.delay, ease: [0.16, 1, 0.3, 1], times: [0, 0.35, 1] }}
          />
        );
      })}
    </div>
  );
}

/** Lingkaran + centang yang tergambar (dipakai saat pesanan berhasil). */
export function DrawnCheck({ size = 96, delay = 0, className }: { size?: number; delay?: number; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 18, delay }}
      aria-hidden="true"
    >
      <motion.circle
        cx="48"
        cy="48"
        r="44"
        fill="#34C759"
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        style={{ originX: '48px', originY: '48px' }}
        transition={{ type: 'spring', stiffness: 300, damping: 14, delay }}
      />
      <motion.path
        d="M28 50 L42 63 L69 34"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut', delay: delay + 0.25 }}
      />
    </motion.svg>
  );
}

/** Gelombang cincin yang mengembang (efek "tring!"). */
export function RingPulse({ color = '#34C759', delay = 0 }: { color?: string; delay?: number }) {
  return (
    <>
      {[0, 0.18].map((offset) => (
        <motion.span
          key={offset}
          className="absolute inset-0 rounded-full border-4"
          style={{ borderColor: color }}
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1.9, opacity: 0 }}
          transition={{ duration: 0.9, delay: delay + offset, ease: 'easeOut' }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
