// Membuat ikon PNG PWA dari bentuk logo (mangkok + atap) tanpa dependency:
// rasterisasi sederhana dengan supersampling 4×4 lalu encode PNG memakai zlib bawaan Node.
// Jalankan: node apps/web/scripts/generate-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');

const RED = [225, 75, 75];
const WHITE = [255, 255, 255];
const INK = [29, 29, 31];

// ---------- PNG encoder ----------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Bentuk logo (ruang koordinat 64 × 64, sama dengan logo.tsx) ----------
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const inRoof = (u, v) =>
  Math.min(distanceToSegment(u, v, 19, 27, 32, 16.5), distanceToSegment(u, v, 32, 16.5, 45, 27)) <= 2;
const inBowl = (u, v) => v >= 32 && (u - 32) ** 2 + (v - 32) ** 2 <= 19 ** 2;
const inDash = (u, v) => Math.abs(v - 36.5) <= 1 && u >= 18 && u <= 46 && (u - 18) % 6.5 < 3;

function inRoundedRect(u, v, radius) {
  const cx = Math.min(Math.max(u, radius), 64 - radius);
  const cy = Math.min(Math.max(v, radius), 64 - radius);
  return u >= 0 && u <= 64 && v >= 0 && v <= 64 && Math.hypot(u - cx, v - cy) <= radius;
}

/**
 * @param {number} size
 * @param {{ background: number[] | null, glyph: number[], accent: number[] | null, rounded: boolean, glyphScale: number }} style
 */
function renderIcon(size, style) {
  const samples = 4;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const u = ((x + (sx + 0.5) / samples) / size) * 64;
          const v = ((y + (sy + 0.5) / samples) / size) * 64;
          let color = null;
          let alpha = 0;
          if (style.background && (!style.rounded || inRoundedRect(u, v, 14.5))) {
            color = style.background;
            alpha = 1;
          }
          // Glyph diperkecil di sekitar titik tengah (zona aman ikon maskable).
          const gu = 32 + (u - 32) / style.glyphScale;
          const gv = 32 + (v - 32) / style.glyphScale;
          if (inRoof(gu, gv) || inBowl(gu, gv)) {
            color = style.glyph;
            alpha = 1;
            if (style.accent && inDash(gu, gv)) {
              color = color.map((c, i) => c * 0.45 + style.accent[i] * 0.55);
            }
          }
          if (color) {
            r += color[0] * alpha;
            g += color[1] * alpha;
            b += color[2] * alpha;
            a += alpha;
          }
        }
      }
      const offset = (y * size + x) * 4;
      const count = samples * samples;
      pixels[offset] = a ? Math.round(r / a) : 0;
      pixels[offset + 1] = a ? Math.round(g / a) : 0;
      pixels[offset + 2] = a ? Math.round(b / a) : 0;
      pixels[offset + 3] = Math.round((a / count) * 255);
    }
  }
  return encodePng(size, pixels);
}

const ICONS = [
  // Pembeli: kotak merah membulat.
  ['icon-192.png', 192, { background: RED, glyph: WHITE, accent: RED, rounded: true, glyphScale: 1 }],
  ['icon-512.png', 512, { background: RED, glyph: WHITE, accent: RED, rounded: true, glyphScale: 1 }],
  ['maskable-512.png', 512, { background: RED, glyph: WHITE, accent: RED, rounded: false, glyphScale: 0.8 }],
  // iOS membulatkan sudut sendiri, jadi latar penuh.
  ['apple-touch-icon.png', 180, { background: RED, glyph: WHITE, accent: RED, rounded: false, glyphScale: 0.92 }],
  // Admin: latar gelap agar beda dari ikon pembeli di HP pemilik.
  ['admin-192.png', 192, { background: INK, glyph: WHITE, accent: RED, rounded: true, glyphScale: 1 }],
  ['admin-512.png', 512, { background: INK, glyph: WHITE, accent: RED, rounded: true, glyphScale: 1 }],
  ['admin-maskable-512.png', 512, { background: INK, glyph: WHITE, accent: RED, rounded: false, glyphScale: 0.8 }],
  ['admin-apple-touch-icon.png', 180, { background: INK, glyph: WHITE, accent: RED, rounded: false, glyphScale: 0.92 }],
  // Badge notifikasi Android: siluet putih di atas transparan.
  ['badge-96.png', 96, { background: null, glyph: WHITE, accent: null, rounded: false, glyphScale: 1.25 }],
];

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, size, style] of ICONS) {
  writeFileSync(join(OUT_DIR, name), renderIcon(size, style));
  console.log(`✓ ${name} (${size}×${size})`);
}
