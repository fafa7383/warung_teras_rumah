'use client';

import {
  DAY_NAMES_ID,
  formatPhoneDisplay,
  type AdminSettingsDto,
  type OperatingHourDto,
  type StoreSettingsInput,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BowlLoader } from '@/components/brand/food-art';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/controls';
import { FieldRow, TextArea, TextInput } from '@/components/ui/fields';
import { ListRow, ListSection } from '@/components/ui/list';
import { BackButton, PageHeader } from '@/components/ui/page-header';
import { adminFetch, adminKeys, useAdminSettings } from '@/lib/admin-api';
import { useAdminLocal } from '@/lib/admin-store';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast-store';
import { ImageUploadField } from './form-fields';

function SubpageHeader({ title }: { title: string }) {
  return <PageHeader title={title} largeTitle={false} leading={<BackButton fallbackHref="/admin/pengaturan" />} />;
}

function useSaveSettings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const save = async (input: StoreSettingsInput, message = 'Pengaturan disimpan') => {
    setSaving(true);
    try {
      const updated = await adminFetch<AdminSettingsDto>('/settings', { method: 'PATCH', body: JSON.stringify(input) });
      queryClient.setQueryData(adminKeys.settings, updated);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan, coba lagi ya');
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { save, saving };
}

function StoreProfileForm({ settings }: { settings: AdminSettingsDto }) {
  const { save, saving } = useSaveSettings();
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp ? formatPhoneDisplay(settings.whatsapp) : '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2">
      <ListSection header="Profil warung" footer="Nomor WhatsApp dipakai tombol Chat & Kirim Pesanan via WhatsApp pembeli.">
        <FieldRow label="Nama warung">
          {({ id }) => <TextInput id={id} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />}
        </FieldRow>
        <FieldRow label="Alamat">
          {({ id }) => <TextArea id={id} value={address} maxLength={200} rows={2} onChange={(e) => setAddress(e.target.value)} />}
        </FieldRow>
        <FieldRow label="Nomor WhatsApp warung">
          {({ id }) => (
            <TextInput
              id={id}
              type="tel"
              inputMode="tel"
              placeholder="08xx-xxxx-xxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          )}
        </FieldRow>
      </ListSection>
      <ListSection header="Logo (opsional)" footer="Tanpa logo, struk memakai logo bawaan.">
        <div className="p-4">
          <ImageUploadField kind="logo" value={logoUrl} onChange={setLogoUrl} emptyLabel="Logo bawaan" />
        </div>
      </ListSection>
      <Button fullWidth loading={saving} onClick={() => void save({ name, address, whatsapp: whatsapp.trim(), logoUrl })}>
        Simpan
      </Button>
    </div>
  );
}

export function StoreProfileSettings() {
  const { data } = useAdminSettings();
  return (
    <>
      <SubpageHeader title="Profil Warung" />
      {data ? <StoreProfileForm settings={data} /> : <BowlLoader />}
    </>
  );
}

function HoursForm({ settings }: { settings: AdminSettingsDto }) {
  const queryClient = useQueryClient();
  const markVisited = useAdminLocal((state) => state.markVisited);
  const [hours, setHours] = useState<OperatingHourDto[]>(settings.hours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    markVisited('hours');
  }, [markVisited]);

  const update = (day: number, patch: Partial<OperatingHourDto>) =>
    setHours((current) => current.map((h) => (h.dayOfWeek === day ? { ...h, ...patch } : h)));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminFetch<AdminSettingsDto>('/hours', { method: 'PUT', body: JSON.stringify({ hours }) });
      queryClient.setQueryData(adminKeys.settings, updated);
      toast.success('Jam operasional disimpan');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan, coba lagi ya');
    } finally {
      setSaving(false);
    }
  };

  // Senin di atas, Minggu di bawah, seperti kalender Indonesia.
  const ordered = [1, 2, 3, 4, 5, 6, 0].flatMap((day) => hours.filter((h) => h.dayOfWeek === day));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2">
      <ListSection header="Jam buka (WIB)" footer="Pemesanan otomatis ditutup di luar jam buka. Jam tidak boleh melewati tengah malam.">
        {ordered.map((hour) => (
          <div key={hour.dayOfWeek} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className={cn('text-body', !hour.isOpen && 'text-label-2')}>{DAY_NAMES_ID[hour.dayOfWeek]}</span>
              <Switch
                checked={hour.isOpen}
                onChange={(isOpen) => update(hour.dayOfWeek, { isOpen })}
                label={`Buka hari ${DAY_NAMES_ID[hour.dayOfWeek]}`}
              />
            </div>
            {hour.isOpen ? (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  aria-label={`Jam buka ${DAY_NAMES_ID[hour.dayOfWeek]}`}
                  value={hour.openTime}
                  onChange={(e) => update(hour.dayOfWeek, { openTime: e.target.value })}
                  className="flex-1 rounded-control bg-fill px-3 py-2 text-body tabular-nums outline-none"
                />
                <span className="text-label-2">–</span>
                <input
                  type="time"
                  aria-label={`Jam tutup ${DAY_NAMES_ID[hour.dayOfWeek]}`}
                  value={hour.closeTime}
                  onChange={(e) => update(hour.dayOfWeek, { closeTime: e.target.value })}
                  className="flex-1 rounded-control bg-fill px-3 py-2 text-body tabular-nums outline-none"
                />
              </div>
            ) : (
              <span className="text-footnote text-label-2">Libur</span>
            )}
          </div>
        ))}
      </ListSection>
      <Button fullWidth loading={saving} onClick={save}>
        Simpan
      </Button>
    </div>
  );
}

export function HoursSettings() {
  const { data } = useAdminSettings();
  return (
    <>
      <SubpageHeader title="Jam Operasional" />
      {data ? <HoursForm settings={data} /> : <BowlLoader />}
    </>
  );
}

function QrisForm({ settings }: { settings: AdminSettingsDto }) {
  const { save, saving } = useSaveSettings();
  const [imageUrl, setImageUrl] = useState(settings.qrisImageUrl);
  const [merchantName, setMerchantName] = useState(settings.qrisMerchantName ?? '');

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2">
      <ListSection
        header="Gambar QRIS"
        footer="Gambar disimpan tanpa kompresi agar tetap bisa dipindai. QRIS baru langsung dipakai pesanan berikutnya."
      >
        <div className="p-4">
          <ImageUploadField kind="qris" value={imageUrl} onChange={setImageUrl} emptyLabel="Belum ada QRIS" />
        </div>
      </ListSection>
      <ListSection header="Nama merchant">
        <FieldRow label="Sesuai nama di QRIS">
          {({ id }) => (
            <TextInput id={id} value={merchantName} maxLength={60} onChange={(e) => setMerchantName(e.target.value)} />
          )}
        </FieldRow>
      </ListSection>
      {imageUrl && (
        <ListSection header="Pratinjau di HP pembeli">
          <div className="flex flex-col items-center gap-2 p-4">
            <div className="w-full max-w-[220px] rounded-section bg-white p-3 ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Pratinjau QRIS" className="w-full" />
            </div>
            {merchantName && <p className="text-footnote text-label-2">a.n. {merchantName}</p>}
          </div>
        </ListSection>
      )}
      <Button
        fullWidth
        loading={saving}
        onClick={() => void save({ qrisImageUrl: imageUrl, qrisMerchantName: merchantName.trim() || null }, 'QRIS disimpan')}
      >
        Simpan
      </Button>
    </div>
  );
}

export function QrisSettings() {
  const { data } = useAdminSettings();
  return (
    <>
      <SubpageHeader title="QRIS" />
      {data ? <QrisForm settings={data} /> : <BowlLoader />}
    </>
  );
}

export function SoundRepeatRow({ settings }: { settings: AdminSettingsDto }) {
  const { save, saving } = useSaveSettings();
  return (
    <ListRow
      title="Bunyi berulang"
      subtitle="Tiap 30 detik selama ada pesanan belum dibuka"
      trailing={
        <Switch
          checked={settings.soundRepeat}
          disabled={saving}
          onChange={(soundRepeat) => void save({ soundRepeat }, soundRepeat ? 'Bunyi berulang aktif' : 'Bunyi berulang mati')}
          label="Bunyi berulang"
        />
      }
    />
  );
}

export { SubpageHeader };
