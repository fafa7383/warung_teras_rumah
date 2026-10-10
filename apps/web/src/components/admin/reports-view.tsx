'use client';

import {
  addDaysToDateKey,
  formatRupiah,
  type ReportBreakdown,
  type ReportResponse,
} from '@wtr/shared';
import { useState } from 'react';
import { BowlLoader } from '@/components/brand/food-art';
import { buttonClass } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/empty-state';
import { Download } from '@/components/ui/icons';
import { ListSection } from '@/components/ui/list';
import { PageHeader } from '@/components/ui/page-header';
import { useAdminReport } from '@/lib/admin-api';
import { cn } from '@/lib/cn';
import { publicEnv } from '@/lib/env';
import { todayKey } from '@/lib/time';

// Palet grafik (divalidasi dengan skrip dataviz: CVD ΔE 24.7, kontras ≥ 3:1 di permukaan putih).
const SERIES_1 = '#2a78d6';
const SERIES_2 = '#eb6834';
const GRID = '#e5e5ea';

type Period = 'today' | '7d' | '30d' | 'custom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const shortDate = (key: string) =>
  `${Number(key.slice(8, 10))} ${MONTHS[Number(key.slice(5, 7)) - 1]}`;
const compactRupiah = new Intl.NumberFormat('id-ID', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function rangeFor(period: Period, custom: { from: string; to: string }) {
  const today = todayKey();
  if (period === 'today') return { from: today, to: today };
  if (period === '7d') return { from: addDaysToDateKey(today, -6), to: today };
  if (period === '30d') return { from: addDaysToDateKey(today, -29), to: today };
  return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
}

/** Kotak angka: label + nilai (angka proporsional, bukan tabular). */
function StatTile({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-section bg-surface p-4 shadow-card',
        hero && 'col-span-2',
      )}
    >
      <span className="text-footnote text-label-2">{label}</span>
      <span
        className={cn(
          'font-semibold text-label',
          hero ? 'text-[44px] leading-[52px] tracking-tight' : 'text-title-2',
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Bar 100% dua bagian + legenda yang sekaligus menjadi tabel nilai. */
function SplitBar({
  title,
  parts,
}: {
  title: string;
  parts: [{ label: string; value: ReportBreakdown }, { label: string; value: ReportBreakdown }];
}) {
  const total = parts[0].value.revenue + parts[1].value.revenue;
  const colors = [SERIES_1, SERIES_2];
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <p className="text-subhead font-semibold">{title}</p>
      {total > 0 ? (
        <div
          className="flex h-3 gap-[2px]"
          role="img"
          aria-label={`${title}: ${parts.map((p) => `${p.label} ${formatRupiah(p.value.revenue)}`).join(', ')}`}
        >
          {parts.map((part, index) =>
            part.value.revenue > 0 ? (
              <span
                key={part.label}
                className="h-full first:rounded-l-[4px] last:rounded-r-[4px]"
                style={{
                  width: `${(part.value.revenue / total) * 100}%`,
                  backgroundColor: colors[index],
                }}
              />
            ) : null,
          )}
        </div>
      ) : (
        <div className="h-3 rounded-[4px] bg-fill" aria-hidden="true" />
      )}
      <ul className="flex flex-col gap-1.5">
        {parts.map((part, index) => (
          <li key={part.label} className="flex items-center gap-2 text-subhead">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colors[index] }}
              aria-hidden="true"
            />
            <span className="flex-1 text-label">{part.label}</span>
            <span className="text-label-2 tabular-nums">{part.value.count} pesanan</span>
            <span className="w-24 text-right font-semibold tabular-nums">
              {formatRupiah(part.value.revenue)}
            </span>
            <span className="w-10 text-right text-label-2 tabular-nums">
              {total > 0 ? `${Math.round((part.value.revenue / total) * 100)}%` : '–'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function niceMax(value: number): number {
  if (value <= 0) return 10_000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

/** Kolom omzet per hari (satu seri, satu warna) + tooltip saat disentuh. */
function DailyRevenueChart({ daily }: { daily: ReportResponse['daily'] }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = niceMax(Math.max(...daily.map((d) => d.revenue)));
  const ticks = [0, max / 2, max];
  const labelEvery = Math.max(1, Math.ceil(daily.length / 6));
  const activeDay = active !== null ? daily[active] : undefined;

  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between">
        <p className="text-subhead font-semibold">Omzet per hari</p>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-subhead text-tint tap"
        >
          {showTable ? 'Lihat grafik' : 'Lihat tabel'}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-subhead">
          <thead>
            <tr className="text-left text-footnote text-label-2">
              <th className="py-1 font-normal">Tanggal</th>
              <th className="py-1 text-right font-normal">Pesanan</th>
              <th className="py-1 text-right font-normal">Omzet</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {daily.map((day) => (
              <tr key={day.date} className="border-t border-separator">
                <td className="py-1.5">{shortDate(day.date)}</td>
                <td className="py-1.5 text-right">{day.count}</td>
                <td className="py-1.5 text-right">{formatRupiah(day.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative pt-8">
          <div className="relative h-44" onPointerLeave={() => setActive(null)}>
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute inset-x-0 flex items-center gap-2"
                style={{ bottom: `${(tick / max) * 100}%`, transform: 'translateY(50%)' }}
                aria-hidden="true"
              >
                <span className="w-10 shrink-0 text-right text-caption text-label-2 tabular-nums">
                  {tick === 0 ? '0' : compactRupiah.format(tick)}
                </span>
                <span
                  className="h-px flex-1"
                  style={{ backgroundColor: tick === 0 ? '#c7c7cc' : GRID }}
                />
              </div>
            ))}
            <div className="absolute inset-y-0 right-0 left-12 flex items-end gap-[2px]">
              {daily.map((day, index) => (
                <button
                  key={day.date}
                  type="button"
                  className="flex h-full flex-1 items-end justify-center outline-none"
                  onPointerEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(index)}
                  aria-label={`${shortDate(day.date)}: ${formatRupiah(day.revenue)}, ${day.count} pesanan`}
                >
                  <span
                    className="w-full max-w-6 rounded-t-[4px] transition-opacity"
                    style={{
                      height: day.revenue > 0 ? `max(2px, ${(day.revenue / max) * 100}%)` : 0,
                      backgroundColor: SERIES_1,
                      opacity: active === null || active === index ? 1 : 0.45,
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-1.5 ml-12 flex gap-[2px]" aria-hidden="true">
            {daily.map((day, index) => (
              <span
                key={day.date}
                className="flex-1 overflow-visible text-center text-caption whitespace-nowrap text-label-2"
              >
                {index % labelEvery === 0 ? shortDate(day.date) : ''}
              </span>
            ))}
          </div>
          {activeDay && (
            <div
              className="pointer-events-none absolute top-0 right-0 left-12 flex justify-center"
              role="status"
            >
              <span className="rounded-full bg-label px-3 py-1 text-footnote text-white shadow-float">
                {shortDate(activeDay.date)} · {formatRupiah(activeDay.revenue)} · {activeDay.count}{' '}
                pesanan
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopItems({ items }: { items: ReportResponse['topItems'] }) {
  const max = Math.max(1, ...items.map((item) => item.quantity));
  if (items.length === 0)
    return (
      <p className="px-4 py-4 text-subhead text-label-2">Belum ada penjualan di periode ini.</p>
    );
  return (
    <ol className="flex flex-col gap-3 px-4 py-4">
      {items.map((item, index) => (
        <li key={item.menuItemId} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2 text-subhead">
            <span className="truncate">
              <span className="mr-2 font-semibold text-label-2 tabular-nums">{index + 1}</span>
              {item.name}
            </span>
            <span className="shrink-0 text-label-2 tabular-nums">
              {item.quantity} porsi · {formatRupiah(item.revenue)}
            </span>
          </div>
          <span
            className="h-2 rounded-r-[4px]"
            style={{ width: `${(item.quantity / max) * 100}%`, backgroundColor: SERIES_1 }}
          />
        </li>
      ))}
    </ol>
  );
}

/** Laporan sederhana (PRD 8.5): hanya pesanan berhasil (Selesai & Dikonfirmasi). */
export function ReportsView() {
  const [period, setPeriod] = useState<Period>('7d');
  const [custom, setCustom] = useState(() => ({
    from: addDaysToDateKey(todayKey(), -6),
    to: todayKey(),
  }));
  const { from, to } = rangeFor(period, custom);
  const { data, isPending, isError } = useAdminReport(from, to);
  const csvUrl = `${publicEnv.adminApiUrl}/api/admin/reports/export.csv?from=${from}&to=${to}`;

  return (
    <>
      <PageHeader title="Laporan" />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4">
        <SegmentedControl
          label="Periode laporan"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'today', label: 'Hari ini' },
            { value: '7d', label: '7 hari' },
            { value: '30d', label: '30 hari' },
            { value: 'custom', label: 'Pilih' },
          ]}
        />
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            {(['from', 'to'] as const).map((key) => (
              <label
                key={key}
                className="flex flex-col gap-1 rounded-section bg-surface px-4 py-2.5"
              >
                <span className="text-footnote text-label-2">
                  {key === 'from' ? 'Dari' : 'Sampai'}
                </span>
                <input
                  type="date"
                  value={custom[key]}
                  max={todayKey()}
                  onChange={(event) =>
                    event.target.value && setCustom((c) => ({ ...c, [key]: event.target.value }))
                  }
                  className="bg-transparent text-body outline-none"
                />
              </label>
            ))}
          </div>
        )}

        {isPending ? (
          <BowlLoader label="Menghitung laporan…" />
        ) : isError || !data ? (
          <EmptyState title="Laporan belum bisa dimuat" message="Coba lagi sebentar ya." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Omzet" value={formatRupiah(data.revenue)} hero />
              <StatTile label="Pesanan berhasil" value={data.orderCount.toLocaleString('id-ID')} />
              <StatTile
                label="Rata-rata per pesanan"
                value={formatRupiah(data.averageOrderValue)}
              />
            </div>

            {data.daily.length > 1 && (
              <ListSection header="Grafik">
                <DailyRevenueChart daily={data.daily} />
              </ListSection>
            )}

            <ListSection header="Perbandingan">
              <SplitBar
                title="Metode bayar"
                parts={[
                  { label: 'Cash', value: data.byPaymentMethod.CASH },
                  { label: 'QRIS', value: data.byPaymentMethod.QRIS },
                ]}
              />
              <SplitBar
                title="Cara pesan"
                parts={[
                  { label: 'Makan di Tempat', value: data.byOrderType.DINE_IN },
                  { label: 'Diantar', value: data.byOrderType.DELIVERY },
                ]}
              />
            </ListSection>

            <ListSection header="5 Menu Terlaris">
              <TopItems items={data.topItems} />
            </ListSection>

            <a href={csvUrl} className={buttonClass({ variant: 'tinted', fullWidth: true })}>
              <Download size={20} aria-hidden="true" />
              Unduh CSV
            </a>
            <p className="-mt-3 text-center text-footnote text-label-2">
              Hanya menghitung pesanan Selesai (diantar) dan Dikonfirmasi (makan di tempat).
            </p>
          </>
        )}
      </div>
    </>
  );
}
