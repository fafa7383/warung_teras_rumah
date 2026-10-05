import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Dashboard dipasang sebagai PWA terpisah "Admin Teras Rumah" (start URL /admin, PRD 8).
export const metadata: Metadata = {
  title: { default: 'Admin Teras Rumah', template: '%s · Admin Teras Rumah' },
  manifest: '/admin.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/admin-apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { capable: true, title: 'Admin Teras', statusBarStyle: 'default' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
