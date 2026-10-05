interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** Ikon mangkok + atap rumah kecil (logo dummy, PRD 3.4). */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M11 19 24 8.5 37 19"
        stroke="var(--color-primary-600)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 24h36a18 18 0 0 1-36 0Z" fill="var(--color-primary-600)" />
      <path
        d="M10 28h28"
        stroke="var(--color-surface)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <rect x="17" y="40" width="14" height="4" rx="2" fill="var(--color-primary-700)" />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark size={size} />
      <span className="font-display text-h2 text-primary-600">Warung Teras Rumah</span>
    </span>
  );
}
