'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Menghitung navigasi di dalam aplikasi agar tombol kembali tahu apakah aman memakai history.back()
// (halaman yang dibuka langsung dari link WhatsApp tidak punya halaman sebelumnya).
let visitedPages = 0;

export function canGoBack(): boolean {
  return visitedPages > 1;
}

export function NavigationTracker() {
  const pathname = usePathname();
  useEffect(() => {
    visitedPages++;
  }, [pathname]);
  return null;
}
