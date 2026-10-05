import { cn } from '@/lib/cn';

/** Ikon aplikasi: mangkok + atap rumah putih di kotak merah membulat (gaya ikon iOS). */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14.5" fill="#E14B4B" />
      <path
        d="M19 27 32 16.5 45 27"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13 32h38a19 19 0 0 1-38 0Z" fill="#fff" />
      <path
        d="M18 36.5h28"
        stroke="#E14B4B"
        strokeWidth="2"
        strokeDasharray="3 3.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Logo({ size = 32, className, compact }: { size?: number; className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={size} />
      <span className={cn('font-rounded font-semibold tracking-tight text-label', compact ? 'text-headline' : 'text-title-3')}>
        Warung Teras Rumah
      </span>
    </span>
  );
}
