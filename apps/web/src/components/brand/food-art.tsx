// Ilustrasi flat SVG (PRD 3.4 & 5.2): mangkok dilihat dari atas + isinya, dan gelas minuman.
// Tanpa id/gradient agar aman dirender berkali-kali dalam satu halaman.
import { cn } from '@/lib/cn';

export type BowlVariant = 'bakso' | 'mie-ayam' | 'seblak' | 'jajanan';

const BRAND = '#E14B4B';

/** Mangkok keramik putih polos: bibir bergaris abu tipis, dinding dalam hangat, bayangan lembut. */
export function BowlRim() {
  return (
    <g>
      <circle cx="100" cy="103" r="91" fill="rgb(0 0 0 / 0.05)" />
      <circle cx="100" cy="100" r="88" fill="#fff" stroke="#E4E1DC" strokeWidth="2" />
      <circle cx="100" cy="100" r="78" fill="#F7F3EE" />
    </g>
  );
}

/** Sendok bebek di bibir mangkok; ikut berputar sebagai penanda gerak di splash. */
export function Spoon() {
  return (
    <g transform="rotate(38 100 100)">
      <rect
        x="93"
        y="2"
        width="14"
        height="48"
        rx="7"
        fill="#fff"
        stroke="#E6DDD4"
        strokeWidth="2"
      />
      <ellipse cx="100" cy="58" rx="16" ry="19" fill="#fff" stroke="#E6DDD4" strokeWidth="2" />
      <ellipse cx="100" cy="60" rx="10" ry="12" fill="#F4EFE9" />
    </g>
  );
}

function Bakso() {
  const balls: [number, number][] = [
    [74, 98],
    [102, 74],
    [128, 100],
    [112, 128],
    [80, 126],
  ];
  const scallions: [number, number][] = [
    [92, 96],
    [118, 82],
    [108, 108],
    [90, 140],
    [132, 124],
    [62, 116],
  ];
  return (
    <g>
      <circle cx="100" cy="100" r="68" fill="#EFC163" />
      <circle cx="92" cy="92" r="48" fill="#F6D58C" opacity="0.6" />
      {balls.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="14" fill="#8A5A3C" />
          <circle cx={x - 4} cy={y - 5} r="4.5" fill="#A97858" />
        </g>
      ))}
      {scallions.map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="3.2"
          fill="none"
          stroke="#56B65C"
          strokeWidth="2.2"
        />
      ))}
      {[
        [70, 80],
        [124, 70],
        [98, 118],
        [140, 112],
        [66, 132],
      ].map(([x, y]) => (
        <circle key={`d${x}`} cx={x} cy={y} r="1.8" fill="#B9772F" />
      ))}
    </g>
  );
}

function MieAyam() {
  return (
    <g>
      <circle cx="100" cy="100" r="68" fill="#D7A562" />
      <g fill="none" stroke="#FFD84D" strokeLinecap="round">
        <circle cx="100" cy="100" r="54" strokeWidth="6" strokeDasharray="26 10" />
        <circle cx="100" cy="100" r="44" strokeWidth="6" strokeDasharray="30 8" />
        <circle cx="100" cy="100" r="34" strokeWidth="6" strokeDasharray="22 7" />
        <circle cx="100" cy="100" r="24" strokeWidth="6" strokeDasharray="14 6" />
        <path d="M58 108q10-12 20 0t20 0t20 0t20 0" strokeWidth="5" />
      </g>
      {[
        [84, 82, -15],
        [108, 88, 20],
        [94, 106, 8],
        [118, 110, -30],
      ].map(([x = 0, y = 0, r = 0]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 7}
          y={y - 6}
          width="15"
          height="12"
          rx="3"
          fill="#9A6233"
          transform={`rotate(${r} ${x} ${y})`}
        />
      ))}
      <g transform="rotate(-30 128 124)">
        <ellipse cx="128" cy="124" rx="18" ry="8" fill="#5FB45A" />
        <path d="M112 124h32" stroke="#9AD58F" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="rotate(28 72 122)">
        <ellipse cx="72" cy="122" rx="16" ry="7.5" fill="#6CBF63" />
        <path d="M58 122h28" stroke="#A7DB9C" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

function Seblak() {
  return (
    <g>
      <circle cx="100" cy="100" r="68" fill="#E2572A" />
      <circle cx="92" cy="94" r="50" fill="#EE7A43" opacity="0.55" />
      <g fill="#F6D776" stroke="#E7BF45" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M66 82q10-12 22-4q6 9-4 16q-12 5-18-12z" />
        <path d="M118 66q14-2 18 10q-2 12-14 10q-10-6-4-20z" />
        <path d="M74 120q8-10 20-4q4 12-8 16q-12 0-12-12z" />
        <path d="M130 120q10 2 8 14q-10 8-18-2q2-10 10-12z" />
      </g>
      <ellipse cx="108" cy="104" rx="17" ry="14" fill="#FFFDF7" />
      <circle cx="110" cy="105" r="7" fill="#F5B83B" />
      {[
        [80, 104],
        [124, 88],
        [100, 136],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="8.5" fill="#B83A33" />
          <circle cx={x} cy={y} r="5" fill="#DE6E66" />
        </g>
      ))}
      {[
        [92, 78],
        [140, 104],
        [64, 100],
        [116, 132],
        [88, 150],
        [138, 140],
      ].map(([x, y]) => (
        <circle key={`c${x}`} cx={x} cy={y} r="2" fill="#7E160E" />
      ))}
    </g>
  );
}

function Jajanan() {
  const basreng: [number, number, number][] = [
    [70, 74, -20],
    [104, 62, 15],
    [126, 86, 60],
    [62, 112, 35],
    [96, 140, -10],
  ];
  const otak: [number, number, number][] = [
    [86, 96, 25],
    [116, 120, -35],
  ];
  return (
    <g>
      <circle cx="100" cy="100" r="70" fill="#FFF1DF" />
      {basreng.map(([x, y, r]) => (
        <rect
          key={`b${x}`}
          x={x - 17}
          y={y - 5}
          width="34"
          height="10"
          rx="5"
          fill="#E57F2C"
          stroke="#C4621A"
          strokeWidth="1.5"
          transform={`rotate(${r} ${x} ${y})`}
        />
      ))}
      {otak.map(([x, y, r]) => (
        <g key={`o${x}`} transform={`rotate(${r} ${x} ${y})`}>
          <rect
            x={x - 21}
            y={y - 7}
            width="42"
            height="14"
            rx="7"
            fill="#E5CBA4"
            stroke="#B9946A"
            strokeWidth="1.5"
          />
          <path
            d={`M${x - 12} ${y - 5}v10M${x - 4} ${y - 5}v10M${x + 4} ${y - 5}v10M${x + 12} ${y - 5}v10`}
            stroke="#B9946A"
            strokeWidth="1.4"
            opacity="0.7"
          />
        </g>
      ))}
      {[
        [80, 128],
        [138, 104],
        [112, 82],
        [70, 92],
      ].map(([x, y]) => (
        <circle key={`p${x}`} cx={x} cy={y} r="2" fill="#C0392B" />
      ))}
    </g>
  );
}

export function BowlFilling({ variant }: { variant: BowlVariant }) {
  switch (variant) {
    case 'bakso':
      return <Bakso />;
    case 'mie-ayam':
      return <MieAyam />;
    case 'seblak':
      return <Seblak />;
    case 'jajanan':
      return <Jajanan />;
  }
}

export function BowlArt({
  variant,
  size,
  spoon = true,
  className,
}: {
  variant: BowlVariant;
  /** Tanpa size, ukuran mengikuti className (mis. w-[62%]). */
  size?: number;
  spoon?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden="true">
      <BowlRim />
      <BowlFilling variant={variant} />
      {spoon && <Spoon />}
    </svg>
  );
}

/** Es teh dalam gelas (ikon kategori Minuman). */
export function DrinkArt({ size, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className={className} aria-hidden="true">
      <ellipse cx="100" cy="178" rx="46" ry="8" fill="rgb(0 0 0 / 0.07)" />
      <rect
        x="110"
        y="10"
        width="10"
        height="112"
        rx="5"
        fill={BRAND}
        transform="rotate(14 115 66)"
      />
      <path
        d="M56 44h88l-10 124q-1 8-9 8H75q-8 0-9-8z"
        fill="#fff"
        stroke="#E6DDD4"
        strokeWidth="3"
      />
      <path d="M62 76h76l-8 90q-1 4-5 4H75q-4 0-5-4z" fill="#F0A238" />
      <path d="M62 76h76l-1 10H63z" fill="#F7C46E" />
      <g fill="#fff" opacity="0.75" stroke="#fff" strokeWidth="1">
        <rect x="74" y="88" width="22" height="20" rx="5" transform="rotate(-10 85 98)" />
        <rect x="102" y="98" width="22" height="20" rx="5" transform="rotate(12 113 108)" />
        <rect x="82" y="118" width="20" height="18" rx="5" transform="rotate(4 92 127)" />
      </g>
      <circle cx="140" cy="50" r="17" fill="#F7E07A" stroke="#E9C63B" strokeWidth="3" />
      <path
        d="M140 36v28M126 50h28M130 40l20 20M150 40l-20 20"
        stroke="#E9C63B"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const BOWL_KINDS = new Set<string>(['bakso', 'mie-ayam', 'seblak', 'jajanan']);

/** Ilustrasi berdasarkan kunci ikon kategori; dipakai di tile kategori & placeholder foto menu. */
export function FoodArt({
  kind,
  size,
  className,
}: {
  kind: string;
  size?: number;
  className?: string;
}) {
  if (kind === 'minuman') return <DrinkArt size={size} className={className} />;
  const variant = (BOWL_KINDS.has(kind) ? kind : 'bakso') as BowlVariant;
  return <BowlArt variant={variant} size={size} spoon={false} className={className} />;
}

/** Tiga garis uap bergelombang yang naik-turun pelan (loop 1,6 detik). */
export function Steam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" className={cn('overflow-visible', className)} aria-hidden="true">
      {[12, 30, 48].map((x, index) => (
        <path
          key={x}
          d={`M${x} 36c-6-6 6-10 0-16s6-10 0-16`}
          fill="none"
          stroke="#C9BFB6"
          strokeWidth="3.2"
          strokeLinecap="round"
          className="animate-steam motion-reduce:animate-none"
          style={{ animationDelay: `${index * 0.25}s` }}
        />
      ))}
    </svg>
  );
}
