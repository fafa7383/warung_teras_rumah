import { WarungLoader } from '@/components/brand/warung-loader';

/** Tampil seketika saat Menu dibuka, selagi daftar menu diambil dari server. */
export default function MenuLoading() {
  return <WarungLoader topic="menu" fill />;
}
