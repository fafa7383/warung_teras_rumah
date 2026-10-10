'use client';

import { WarungLoader } from '@/components/brand/warung-loader';
import {
  Bell,
  Clock,
  ImagePlus,
  KeyRound,
  QrCode,
  Smartphone,
  Store,
  Utensils,
} from '@/components/ui/icons';
import { ListRow, ListSection, RowIcon } from '@/components/ui/list';
import { PageHeader } from '@/components/ui/page-header';
import { useAdminSettings } from '@/lib/admin-api';

/** Pengaturan ala aplikasi Settings iOS (PRD 8.6). */
export function SettingsHome() {
  const { data: settings, isPending } = useAdminSettings();
  if (isPending || !settings) {
    return (
      <>
        <PageHeader title="Pengaturan" />
        <WarungLoader topic="pengaturan" />
      </>
    );
  }
  const status = settings.status.isOpen
    ? `Buka · tutup ${settings.status.closesAt ?? ''}`
    : settings.status.nextOpenLabel
      ? `Tutup · buka ${settings.status.nextOpenLabel}`
      : 'Tutup';

  return (
    <>
      <PageHeader title="Pengaturan" />
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4">
        <ListSection header="Warung">
          <ListRow
            href="/admin/pengaturan/toko"
            leading={<RowIcon icon={Store} tint="red" />}
            title="Profil warung"
            subtitle={settings.whatsapp ? settings.name : 'Nomor WhatsApp belum diisi'}
          />
          <ListRow href="/admin/pengaturan/jam" leading={<RowIcon icon={Clock} tint="orange" />} title="Jam operasional" value={status} />
          <ListRow
            href="/admin/pengaturan/qris"
            leading={<RowIcon icon={QrCode} tint="blue" />}
            title="QRIS"
            value={settings.qrisImageUrl ? 'Aktif' : 'Belum diupload'}
          />
        </ListSection>
        <ListSection header="Tampilan pembeli">
          <ListRow href="/admin/pengaturan/banner" leading={<RowIcon icon={ImagePlus} tint="indigo" />} title="Banner promo" />
          <ListRow href="/admin/pengaturan/kategori" leading={<RowIcon icon={Utensils} tint="green" />} title="Kategori menu" />
        </ListSection>
        <ListSection header="Notifikasi">
          <ListRow href="/admin/pengaturan/notifikasi" leading={<RowIcon icon={Bell} tint="red" />} title="Notifikasi & suara" />
        </ListSection>
        <ListSection header="Lainnya">
          <ListRow href="/admin/pengaturan/akun" leading={<RowIcon icon={KeyRound} tint="gray" />} title="Akun & keamanan" />
          <ListRow
            href="/admin/pengaturan/bantuan"
            leading={<RowIcon icon={Smartphone} tint="blue" />}
            title="Pasang ke Home Screen"
            subtitle="Panduan Android & iPhone"
          />
        </ListSection>
      </div>
    </>
  );
}
