import { cn } from '@/lib/cn';

/** Activity indicator ala iOS: 8 garis yang memudar berputar. */
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="progressbar"
      aria-label="Memuat"
      className={cn('animate-spin [animation-duration:900ms] [animation-timing-function:steps(8)]', className)}
    >
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          x="11"
          y="2"
          width="2"
          height="6"
          rx="1"
          fill="currentColor"
          opacity={0.2 + (i / 8) * 0.8}
          transform={`rotate(${i * 45} 12 12)`}
        />
      ))}
    </svg>
  );
}
