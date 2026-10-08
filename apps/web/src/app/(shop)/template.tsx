import type { ReactNode } from 'react';

// Template dibuat ulang setiap pindah halaman, jadi animasi masuknya berputar di tiap navigasi.
export default function ShopTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
