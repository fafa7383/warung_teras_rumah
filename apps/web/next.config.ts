import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @wtr/shared diekspor sebagai source TypeScript di monorepo.
  transpilePackages: ['@wtr/shared'],
  poweredByHeader: false,
  images: {
    // Foto menu, banner, logo, dan QRIS dari bucket publik Supabase Storage.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default nextConfig;
