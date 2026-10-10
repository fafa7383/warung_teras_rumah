import { WarungLoader } from '@/components/brand/warung-loader';

/** Perpindahan antarhalaman dashboard yang belum siap (mis. prefetch belum selesai). */
export default function AdminLoading() {
  return <WarungLoader topic="admin" fill />;
}
