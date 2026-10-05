'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { SegmentedControl, Switch } from '@/components/ui/controls';
import { ConfirmDialog } from '@/components/ui/dialog';
import { FieldRow, TextInput } from '@/components/ui/fields';
import { LogOut } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { adminFetch, useAdminMe, useAdminSettings } from '@/lib/admin-api';
import {
  enableSound,
  isSoundPreferred,
  isSoundReady,
  playChime,
  setSoundPreferred,
  subscribeSound,
} from '@/lib/admin-sound';
import { ApiError } from '@/lib/api-client';
import { isIos, isStandalone } from '@/lib/device';
import { useHydrated } from '@/lib/hooks';
import { getPushState, subscribePush, unsubscribePush, type PushState } from '@/lib/push-client';
import { toast } from '@/lib/toast-store';
import { SoundRepeatRow, SubpageHeader } from './settings-store';

const PUSH_LABELS: Record<PushState, string> = {
  subscribed: 'Aktif di HP ini',
  unsubscribed: 'Belum aktif',
  denied: 'Diblokir di pengaturan browser',
  unsupported: 'Browser ini tidak mendukung',
  'needs-install': 'Pasang ke Home Screen dulu',
};

/** Notifikasi: Web Push + tes, suara + tes, bunyi berulang, WA gateway fase 2 (PRD 8.6). */
export function NotificationSettings() {
  const router = useRouter();
  const { data: settings } = useAdminSettings();
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const soundReady = useSyncExternalStore(subscribeSound, isSoundReady, () => false);
  const soundOn = useSyncExternalStore(subscribeSound, isSoundPreferred, () => true);

  useEffect(() => {
    void getPushState().then(setPushState);
  }, []);

  const togglePush = async (on: boolean) => {
    setBusy(true);
    try {
      setPushState(on ? await subscribePush() : await unsubscribePush());
    } catch {
      toast.error('Notifikasi gagal diaktifkan, coba lagi ya');
    } finally {
      setBusy(false);
    }
  };

  const testPush = async () => {
    setBusy(true);
    try {
      await adminFetch('/push/test', { method: 'POST' });
      toast.success('Tes terkirim, cek notifikasi HP');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Tes gagal dikirim');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SubpageHeader title="Notifikasi & Suara" />
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 pt-2">
        <ListSection
          header="Notifikasi HP (Web Push)"
          footer="Pesanan baru tetap muncul walau dashboard tertutup. Di iPhone wajib dipasang ke Home Screen (iOS 16.4+)."
        >
          <ListRow
            title="Notifikasi pesanan"
            subtitle={pushState ? PUSH_LABELS[pushState] : 'Memeriksa…'}
            trailing={
              pushState === 'subscribed' || pushState === 'unsubscribed' ? (
                <Switch checked={pushState === 'subscribed'} disabled={busy} onChange={(on) => void togglePush(on)} label="Notifikasi pesanan" />
              ) : undefined
            }
          />
          {pushState === 'needs-install' && (
            <ListRow title="Lihat cara pasang" onClick={() => router.push('/admin/pengaturan/bantuan')} chevron />
          )}
          {pushState === 'subscribed' && (
            <div className="px-4 py-3">
              <Button size="md" variant="tinted" loading={busy} onClick={() => void testPush()}>
                Kirim Tes
              </Button>
            </div>
          )}
        </ListSection>

        <ListSection header="Suara di dashboard" footer="Browser perlu satu ketukan sebelum suara bisa diputar.">
          <ListRow
            title="Bunyi pesanan baru"
            subtitle={soundOn ? (soundReady ? 'Siap berbunyi' : 'Ketuk Tes Suara untuk mengaktifkan') : 'Mati'}
            trailing={<Switch checked={soundOn} onChange={setSoundPreferred} label="Bunyi pesanan baru" />}
          />
          {settings && <SoundRepeatRow settings={settings} />}
          <div className="px-4 py-3">
            <Button
              size="md"
              variant="tinted"
              onClick={() => void enableSound().then((ok) => (ok ? playChime() : toast.error('Suara tidak bisa diputar')))}
            >
              Tes Suara
            </Button>
          </div>
        </ListSection>

        <ListSection header="WhatsApp otomatis (fase 2)">
          <ListRow
            title="Kirim WA ke pemilik"
            subtitle={
              settings?.waGatewayEnabled
                ? `Aktif, dikirim ke ${settings.whatsapp || 'nomor warung'}`
                : 'Belum aktif. Isi WA_GATEWAY_TOKEN di server untuk mengaktifkan.'
            }
          />
        </ListSection>
      </div>
    </>
  );
}

type PasswordValues = z.output<typeof changePasswordSchema>;

export function AccountSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useAdminMe();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<z.input<typeof changePasswordSchema>, unknown, PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const changePassword = async (values: PasswordValues) => {
    try {
      await adminFetch('/auth/password', { method: 'PATCH', body: JSON.stringify(values) });
      reset();
      toast.success('Password diganti. Sesi di HP lain otomatis keluar.');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal mengganti password');
    }
  };

  const logout = async () => {
    await adminFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    queryClient.removeQueries({ queryKey: ['admin'] });
    router.replace('/admin/login');
  };

  return (
    <>
      <SubpageHeader title="Akun & Keamanan" />
      <div className="mx-auto flex max-w-2xl flex-col gap-7 px-4 pt-2">
        <ListSection>
          <ListRow title="Username" value={me?.username ?? '…'} />
        </ListSection>
        <form noValidate onSubmit={handleSubmit(changePassword)} className="flex flex-col gap-3">
          <ListSection header="Ganti password" footer="Minimal 10 karakter. Setelah diganti, sesi di HP lain keluar otomatis.">
            <FieldRow label="Password lama" error={formState.errors.currentPassword?.message}>
              {({ id, invalid }) => (
                <TextInput id={id} type="password" aria-invalid={invalid} autoComplete="current-password" {...register('currentPassword')} />
              )}
            </FieldRow>
            <FieldRow label="Password baru" error={formState.errors.newPassword?.message}>
              {({ id, invalid }) => (
                <TextInput id={id} type="password" aria-invalid={invalid} autoComplete="new-password" {...register('newPassword')} />
              )}
            </FieldRow>
          </ListSection>
          <Button type="submit" fullWidth loading={formState.isSubmitting}>
            Ganti Password
          </Button>
        </form>
        <Button variant="destructive-tinted" fullWidth icon={<LogOut size={20} aria-hidden="true" />} onClick={() => setConfirmLogout(true)}>
          Keluar
        </Button>
      </div>
      <ConfirmDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Keluar dari dashboard?"
        message="Notifikasi suara di HP ini berhenti sampai kamu masuk lagi."
        actions={[
          { label: 'Batal', style: 'cancel', onPress: () => setConfirmLogout(false) },
          { label: 'Keluar', style: 'destructive', onPress: () => void logout() },
        ]}
      />
    </>
  );
}

const GUIDES = {
  iphone: [
    'Buka dashboard ini di Safari (bukan Chrome).',
    'Ketuk tombol Bagikan (kotak dengan panah ke atas) di bawah layar.',
    'Gulir lalu pilih "Tambah ke Layar Utama".',
    'Ketuk "Tambah". Ikon "Admin Teras" muncul di Home Screen.',
    'Buka dashboard dari ikon itu, lalu aktifkan notifikasi di Pengaturan > Notifikasi & Suara.',
  ],
  android: [
    'Buka dashboard ini di Chrome.',
    'Ketuk menu titik tiga di kanan atas.',
    'Pilih "Instal aplikasi" atau "Tambahkan ke layar utama".',
    'Ketuk "Instal". Ikon "Admin Teras" muncul di Home Screen.',
    'Buka dari ikon itu, lalu aktifkan notifikasi di Pengaturan > Notifikasi & Suara.',
  ],
} as const;

/** Panduan pasang ke Home Screen Android & iPhone (PRD 8.1). */
export function InstallGuide() {
  const hydrated = useHydrated();
  const [chosen, setPlatform] = useState<'iphone' | 'android' | null>(null);
  // Deteksi perangkat hanya setelah hidrasi agar HTML server & client sama.
  const platform = chosen ?? (hydrated && isIos() ? 'iphone' : 'android');
  const installed = hydrated && isStandalone();
  return (
    <>
      <SubpageHeader title="Pasang ke Home Screen" />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2">
        {installed && (
          <p className="rounded-section bg-green-soft p-4 text-subhead text-green-text">Dashboard sudah terpasang di HP ini.</p>
        )}
        <SegmentedControl
          label="Jenis HP"
          value={platform}
          onChange={setPlatform}
          options={[
            { value: 'iphone', label: 'iPhone' },
            { value: 'android', label: 'Android' },
          ]}
        />
        <ListSection>
          <ol className="list-separators">
            {GUIDES[platform].map((step, index) => (
              <li key={step} className="flex gap-3 px-4 py-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tint text-footnote font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-body">{step}</span>
              </li>
            ))}
          </ol>
        </ListSection>
        {platform === 'iphone' && (
          <p className="px-1 text-footnote text-label-2">Notifikasi di iPhone butuh iOS 16.4 atau lebih baru.</p>
        )}
      </div>
    </>
  );
}
