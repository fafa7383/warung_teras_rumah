import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';

// Alamat IP laptop di jaringan lokal, agar server development bisa dibuka dari HP lewat WiFi.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .flatMap((network) =>
    network && network.family === 'IPv4' && !network.internal ? [network.address] : [],
  );

// Produksi: alamat server API (mis. https://xxx.onrender.com), hanya dibaca di server.
// Bila diisi, /api/admin/* di domain web diteruskan ke sana sehingga cookie login admin tetap
// "first-party" (browser memblokir cookie dari domain lain). Panggilan pembeli tetap langsung ke
// API agar rate limit membaca IP asli pembeli, bukan IP server web.
const apiProxyTarget = process.env.API_URL_INTERNAL?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // Folder hasil build bisa dipisah (mis. NEXT_DIST_DIR=.next-check) untuk uji build lokal
  // tanpa mengganggu `pnpm dev` yang sedang berjalan. Hosting memakai bawaan `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  env: {
    // Diberitahukan ke browser: panggilan admin memakai domain web sendiri (lihat lib/env.ts).
    NEXT_PUBLIC_ADMIN_API_PROXY: apiProxyTarget ? '1' : '',
  },
  async rewrites() {
    return apiProxyTarget
      ? [{ source: '/api/admin/:path*', destination: `${apiProxyTarget}/api/admin/:path*` }]
      : [];
  },
  // @wtr/shared diekspor sebagai source TypeScript di monorepo.
  transpilePackages: ['@wtr/shared'],
  poweredByHeader: false,
  // Indikator "N" mode development menutupi tab bar & tombol bawah di tampilan HP.
  devIndicators: false,
  allowedDevOrigins: lanHosts,
  images: {
    // Foto menu, banner, logo, dan QRIS dari bucket publik Supabase Storage.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;
