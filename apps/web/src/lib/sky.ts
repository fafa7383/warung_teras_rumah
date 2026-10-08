// Palet langit header Home sepanjang hari (jam WIB berpecahan). Warna berpindah halus di antara
// titik-titik kunci, jadi jam 17.30 sudah keemasan dan 18.30 mulai biru gelap, bukan lompat per suasana.

export type Rgb = readonly [number, number, number];

export interface SkyState {
  /** Warna langit di atas (zenit) dan di bawah (horizon). */
  top: Rgb;
  horizon: Rgb;
  /** Sisi awan yang kena cahaya dan sisi bayangannya. */
  cloudLit: Rgb;
  cloudShade: Rgb;
  /** Warna cahaya matahari/bulan untuk pendar dan tepi awan. */
  light: Rgb;
  stars: number;
  /** 0 = langit bersih, 1 = penuh awan. */
  cover: number;
  rays: number;
  /** Posisi dalam kanvas: x 0–1 dari kiri, y 0–1 dari bawah. */
  sun: readonly [number, number];
  sunAmount: number;
  moon: readonly [number, number];
  moonAmount: number;
  /** Sumber cahaya untuk bayangan awan (campuran matahari & bulan). */
  lightPos: readonly [number, number];
}

interface Keyframe {
  hour: number;
  top: string;
  horizon: string;
  cloudLit: string;
  cloudShade: string;
  light: string;
  stars: number;
  cover: number;
  rays: number;
}

const NIGHT = {
  top: '#060A18',
  horizon: '#18213F',
  cloudLit: '#3B4668',
  cloudShade: '#141A30',
  light: '#9FB4FF',
  stars: 1,
  cover: 0.38,
  rays: 0,
};

const KEYFRAMES: Keyframe[] = [
  { hour: 0, ...NIGHT },
  { hour: 4.9, ...NIGHT },
  // Fajar & matahari terbit
  {
    hour: 5.7,
    top: '#1B2650',
    horizon: '#E99A78',
    cloudLit: '#F6B49B',
    cloudShade: '#45426A',
    light: '#FFB37A',
    stars: 0.25,
    cover: 0.45,
    rays: 0.15,
  },
  {
    hour: 6.4,
    top: '#33619F',
    horizon: '#FAD0A8',
    cloudLit: '#FFE6CF',
    cloudShade: '#8E97B5',
    light: '#FFD2A1',
    stars: 0,
    cover: 0.48,
    rays: 0.3,
  },
  // Pagi cerah sampai siang
  {
    hour: 8.5,
    top: '#2468C8',
    horizon: '#9CCBF3',
    cloudLit: '#FFFFFF',
    cloudShade: '#A3B3CC',
    light: '#FFF4DE',
    stars: 0,
    cover: 0.5,
    rays: 0.25,
  },
  {
    hour: 12.5,
    top: '#1E63C4',
    horizon: '#A6D0F2',
    cloudLit: '#FFFFFF',
    cloudShade: '#AEBCD2',
    light: '#FFF8EA',
    stars: 0,
    cover: 0.48,
    rays: 0.2,
  },
  // Sore: makin hangat sampai keemasan
  {
    hour: 14.5,
    top: '#2D67BC',
    horizon: '#E8D8B8',
    cloudLit: '#FFF3DE',
    cloudShade: '#B3AFB4',
    light: '#FFE7B8',
    stars: 0,
    cover: 0.52,
    rays: 0.35,
  },
  {
    hour: 16.6,
    top: '#4F68AE',
    horizon: '#FFB873',
    cloudLit: '#FFD9A6',
    cloudShade: '#A38394',
    light: '#FFC27A',
    stars: 0,
    cover: 0.55,
    rays: 0.5,
  },
  {
    hour: 17.6,
    top: '#3E4789',
    horizon: '#FF8F52',
    cloudLit: '#FFB07C',
    cloudShade: '#7B5878',
    light: '#FF9F5A',
    stars: 0,
    cover: 0.55,
    rays: 0.55,
  },
  // Matahari terbenam, lalu blue hour
  {
    hour: 18.25,
    top: '#262A5E',
    horizon: '#E0675C',
    cloudLit: '#F2937E',
    cloudShade: '#4C3C66',
    light: '#FF8A60',
    stars: 0.15,
    cover: 0.5,
    rays: 0.3,
  },
  {
    hour: 19,
    top: '#10173A',
    horizon: '#3A3D76',
    cloudLit: '#5B5D8F',
    cloudShade: '#20244A',
    light: '#B0A8FF',
    stars: 0.6,
    cover: 0.42,
    rays: 0,
  },
  { hour: 19.8, ...NIGHT },
  { hour: 24, ...NIGHT },
];

const MOON_POSITION = [0.8, 0.74] as const;

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];
/** 0 sebelum `from`, naik halus ke 1 di `to` (atau turun bila `to` < `from`). */
const ramp = (hour: number, from: number, to: number) =>
  smooth(clamp01((hour - from) / (to - from)));

const PARSED = KEYFRAMES.map((frame) => ({
  ...frame,
  colors: {
    top: hexToRgb(frame.top),
    horizon: hexToRgb(frame.horizon),
    cloudLit: hexToRgb(frame.cloudLit),
    cloudShade: hexToRgb(frame.cloudShade),
    light: hexToRgb(frame.light),
  },
}));

export function skyAt(hour: number): SkyState {
  const h = ((hour % 24) + 24) % 24;
  const index = Math.max(
    0,
    PARSED.findIndex((frame, i) => h >= frame.hour && h < (PARSED[i + 1]?.hour ?? Infinity)),
  );
  const a = PARSED[index]!;
  const b = PARSED[Math.min(index + 1, PARSED.length - 1)]!;
  const t = b.hour > a.hour ? smooth((h - a.hour) / (b.hour - a.hour)) : 0;

  // Matahari naik lalu turun, tapi sengaja dijaga di pojok kanan atas agar silaunya tidak
  // jatuh di belakang judul dan label status.
  const dayProgress = clamp01((h - 5.8) / 12.4);
  const sun = [0.9 - 0.12 * dayProgress, 0.58 + 0.34 * Math.sin(Math.PI * dayProgress)] as const;
  const sunAmount = Math.min(ramp(h, 5.5, 6.3), 1 - ramp(h, 17.9, 18.7));
  const moonAmount = Math.max(ramp(h, 19, 19.8), 1 - ramp(h, 4.9, 5.7));
  const sunWeight = sunAmount / (sunAmount + moonAmount + 1e-4);

  return {
    top: mixRgb(a.colors.top, b.colors.top, t),
    horizon: mixRgb(a.colors.horizon, b.colors.horizon, t),
    cloudLit: mixRgb(a.colors.cloudLit, b.colors.cloudLit, t),
    cloudShade: mixRgb(a.colors.cloudShade, b.colors.cloudShade, t),
    light: mixRgb(a.colors.light, b.colors.light, t),
    stars: lerp(a.stars, b.stars, t),
    cover: lerp(a.cover, b.cover, t),
    rays: lerp(a.rays, b.rays, t),
    sun,
    sunAmount,
    moon: MOON_POSITION,
    moonAmount,
    lightPos: [
      lerp(MOON_POSITION[0], sun[0], sunWeight),
      lerp(MOON_POSITION[1], sun[1], sunWeight),
    ],
  };
}

/** Warna bar status/browser yang menyatu dengan bagian atas langit (sudah termasuk scrim gelap). */
export function skyThemeColor(hour: number, scrim = 0.25): string {
  const [r, g, b] = skyAt(hour).top;
  const toHex = (channel: number) =>
    Math.round(channel * (1 - scrim) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
