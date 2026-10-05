import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import './globals.css';

// Hanya dipakai bila font sistem Apple (SF Pro) tidak tersedia, jadi tidak di-preload.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', preload: false });

export const metadata: Metadata = {
  title: { default: 'Warung Teras Rumah', template: '%s · Warung Teras Rumah' },
  description:
    'Pesan bakso, mie ayam, seblak, jajanan, dan minuman dari Warung Teras Rumah. Makan di tempat atau diantar, gratis ongkir.',
  applicationName: 'Warung Teras Rumah',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: 'Teras Rumah', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#F2F2F7',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // Agar env(safe-area-inset-*) bekerja untuk tab bar & tombol bawah di iPhone.
  viewportFit: 'cover',
};

// Dijalankan sebelum halaman tampil: splash hanya sekali per sesi dan tidak untuk link pesanan/admin (PRD 5.4).
const splashScript = `try{var p=location.pathname;var d=document.documentElement;if(sessionStorage.getItem('wtr-splash')||p.indexOf('/pesanan')===0||p.indexOf('/admin')===0||p.indexOf('/offline')===0){d.dataset.splash='done'}else{d.dataset.splash='running'}}catch(e){document.documentElement.dataset.splash='done'}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
