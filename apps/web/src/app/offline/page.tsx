import type { Metadata } from 'next';
import { OfflineView } from './offline-view';

export const metadata: Metadata = { title: 'Offline' };

// Halaman statis yang disimpan service worker untuk ditampilkan saat tidak ada koneksi.
export default function OfflinePage() {
  return <OfflineView />;
}
