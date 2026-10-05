'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Check, X } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { useAdminSettings } from '@/lib/admin-api';
import { enableSound, isSoundReady, playChime, subscribeSound } from '@/lib/admin-sound';
import { useAdminLocal } from '@/lib/admin-store';
import { cn } from '@/lib/cn';
import { isStandalone } from '@/lib/device';
import { useHydrated } from '@/lib/hooks';
import { getPushState, type PushState } from '@/lib/push-client';

function StepMark({ done, index }: { done: boolean; index: number }) {
  return (
    <span
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-full text-footnote font-bold',
        done ? 'bg-green text-white' : 'bg-fill text-label-2',
      )}
      aria-hidden="true"
    >
      {done ? <Check size={16} strokeWidth={3} /> : index + 1}
    </span>
  );
}

/** Checklist login pertama yang bisa ditutup (PRD 8.1). */
export function OnboardingChecklist() {
  const hydrated = useHydrated();
  const { data: settings } = useAdminSettings();
  const dismissed = useAdminLocal((state) => state.onboardingDismissed);
  const dismiss = useAdminLocal((state) => state.dismissOnboarding);
  const visited = useAdminLocal((state) => state.visited);
  const soundReady = useSyncExternalStore(subscribeSound, isSoundReady, () => false);
  const [pushState, setPushState] = useState<PushState | null>(null);

  useEffect(() => {
    void getPushState().then(setPushState);
  }, []);

  if (!hydrated || dismissed || !settings) return null;

  const steps = [
    { title: 'Pasang ke Home Screen', subtitle: 'Panduan Android & iPhone', done: isStandalone(), href: '/admin/pengaturan/bantuan' },
    { title: 'Aktifkan notifikasi', subtitle: 'Pesanan baru muncul di HP', done: pushState === 'subscribed', href: '/admin/pengaturan/notifikasi' },
    {
      title: 'Aktifkan suara',
      subtitle: 'Bunyi lonceng saat ada pesanan',
      done: soundReady,
      onClick: () => void enableSound().then((ok) => ok && playChime(1)),
    },
    { title: 'Isi nomor WhatsApp warung', subtitle: 'Dipakai tombol WA pembeli', done: Boolean(settings.whatsapp), href: '/admin/pengaturan/toko' },
    { title: 'Upload QRIS', subtitle: 'Untuk pembayaran QRIS', done: Boolean(settings.qrisImageUrl), href: '/admin/pengaturan/qris' },
    { title: 'Atur jam buka', subtitle: 'Pemesanan otomatis tutup di luar jam', done: Boolean(visited.hours), href: '/admin/pengaturan/jam' },
    { title: 'Cek daftar menu', subtitle: 'Ganti nama, harga, dan foto asli', done: Boolean(visited.menu), href: '/admin/menu' },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <ListSection
      header={`Persiapan warung · ${doneCount}/${steps.length}`}
      trailing={
        <button type="button" onClick={dismiss} className="tap flex items-center gap-1 text-footnote text-label-2">
          <X size={14} aria-hidden="true" /> Tutup
        </button>
      }
    >
      {steps.map((step, index) => (
        <ListRow
          key={step.title}
          leading={<StepMark done={step.done} index={index} />}
          title={<span className={cn(step.done && 'text-label-2 line-through')}>{step.title}</span>}
          subtitle={step.subtitle}
          href={step.done ? undefined : step.href}
          onClick={step.done ? undefined : step.onClick}
          chevron={!step.done}
        />
      ))}
    </ListSection>
  );
}
