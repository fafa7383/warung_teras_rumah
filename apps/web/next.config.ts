import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';

// Alamat IP laptop di jaringan lokal, agar server development bisa dibuka dari HP lewat WiFi.
const lanHosts = Object.values(networkInterfaces())
  .flat()
  .flatMap((network) => (network && network.family === 'IPv4' && !network.internal ? [network.address] : []));

const nextConfig: NextConfig = {
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
