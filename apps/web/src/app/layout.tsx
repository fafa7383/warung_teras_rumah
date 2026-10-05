import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Warung Teras Rumah', template: '%s · Warung Teras Rumah' },
  description:
    'Pesan bakso, mie ayam, seblak, jajanan, dan minuman dari Warung Teras Rumah. Makan di tempat atau diantar, gratis ongkir.',
  applicationName: 'Warung Teras Rumah',
};

export const viewport: Viewport = {
  themeColor: '#E14B4B',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // Agar env(safe-area-inset-bottom) bekerja untuk bottom nav di iPhone.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
