import { DAYPART_START_HOUR, WIB_OFFSET_MS } from '@wtr/shared';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { DAYPART_PREVIEW_PARAM } from '@/lib/day-clock';
import './globals.css';

// Hanya dipakai bila font sistem Apple (SF Pro) tidak tersedia, jadi tidak di-preload.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

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

// Suasana header Home (pagi/sore/malam WIB) juga dipasang sebelum paint agar tidak berkedip.
// Saat development, `?jam=19.5` meniru jam lain (lihat lib/day-clock.ts).
const { morning, afternoon, night } = DAYPART_START_HOUR;
const previewHour =
  process.env.NODE_ENV === 'production'
    ? ''
    : `var m=/[?&]${DAYPART_PREVIEW_PARAM}=([0-9]+(?:[.,][0-9]+)?)/.exec(location.search);if(m){var v=Number(m[1].replace(',','.'));if(v<24)h=v}`;
const daypartScript = `try{var h=((Date.now()+${WIB_OFFSET_MS})%864e5)/36e5;${previewHour}document.documentElement.dataset.daypart=h>=${morning}&&h<${afternoon}?'morning':h>=${afternoon}&&h<${night}?'afternoon':'night'}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: splashScript + daypartScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
