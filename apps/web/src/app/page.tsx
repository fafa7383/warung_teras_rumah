import { formatRupiah } from '@wtr/shared';
import { Logo } from '@/components/brand/logo';
import { ApiStatus } from '@/components/dev/api-status';

// Halaman sementara untuk memeriksa fondasi (token desain, font, paket shared, koneksi API).
// Diganti Splash + Home pada Hari 2.

const COLOR_TOKENS = [
  ['primary-600', 'bg-primary-600'],
  ['primary-700', 'bg-primary-700'],
  ['primary-100', 'bg-primary-100'],
  ['primary-50', 'bg-primary-50'],
  ['accent-400', 'bg-accent-400'],
  ['peach-200', 'bg-peach-200'],
  ['cream (bg)', 'bg-cream'],
  ['surface', 'bg-surface'],
  ['line (border)', 'bg-line'],
  ['ink', 'bg-ink'],
  ['ink-muted', 'bg-ink-muted'],
  ['ink-disabled', 'bg-ink-disabled'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['info', 'bg-info'],
  ['danger', 'bg-danger'],
] as const;

const STATUS_BADGES = [
  ['Menunggu Konfirmasi', 'bg-warning-100 text-ink'],
  ['Diproses', 'bg-primary-100 text-primary-700'],
  ['Diantar', 'bg-info-100 text-ink'],
  ['Selesai', 'bg-success-100 text-ink'],
  ['Ditolak', 'bg-danger-100 text-danger'],
] as const;

export default function SetupPage() {
  return (
    <main className="mx-auto flex max-w-content flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <Logo />
        <h1 className="font-display text-display">Fondasi siap, Kak!</h1>
        <p className="text-ink-muted">
          Halaman ini hanya untuk mengecek setup. Splash dan Home dibangun di Hari 2.
        </p>
        <ApiStatus />
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-h2">Warna</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COLOR_TOKENS.map(([name, swatch]) => (
            <li key={name} className="flex items-center gap-3 rounded-card bg-surface p-3 shadow-card">
              <span className={`size-10 shrink-0 rounded-control border border-line ${swatch}`} />
              <span className="text-caption">{name}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card">
        <h2 className="font-display text-h2">Tipografi</h2>
        <p className="font-display text-display">Display 28 · Fredoka</p>
        <p className="font-display text-h1">H1 22 · Mau makan apa hari ini, Kak?</p>
        <p className="font-display text-h2">H2 18 · Paling Laris</p>
        <p className="text-body-lg">Body-lg 16 · Bakso Urat</p>
        <p className="text-body text-ink-muted">Body 14 · Bakso urat kenyal dengan kuah kaldu sapi.</p>
        <p className="text-caption text-ink-muted">Caption 12 · Wajib pilih 1</p>
        <p className="text-price text-primary-600">{formatRupiah(15000)}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-h2">Komponen dasar</h2>
        <div className="flex flex-col gap-3 sm:max-w-sm">
          <button
            type="button"
            className="h-cta rounded-control bg-primary-600 font-bold text-white transition-colors duration-150 ease-standard active:bg-primary-700"
          >
            Pesan Sekarang · {formatRupiah(45000)}
          </button>
          <button
            type="button"
            className="h-cta rounded-control border-2 border-primary-600 font-bold text-primary-600"
          >
            Chat WhatsApp
          </button>
          <input
            className="h-12 rounded-control border border-line bg-surface px-4 placeholder:text-ink-disabled"
            placeholder="Nama kamu"
            aria-label="Contoh input"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_BADGES.map(([label, className]) => (
            <span key={label} className={`rounded-full px-3 py-1 text-caption ${className}`}>
              {label}
            </span>
          ))}
        </div>
        <div className="flex gap-3" aria-hidden="true">
          <div className="skeleton h-24 w-36 rounded-card" />
          <div className="skeleton h-24 w-36 rounded-card" />
        </div>
      </section>
    </main>
  );
}
