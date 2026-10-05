'use client';

import { formatDateTimeWIB, formatRupiah, isFinalStatus, type OrderSummaryDto } from '@wtr/shared';
import Link from 'next/link';
import { BowlArt } from '@/components/brand/food-art';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, Skeleton } from '@/components/ui/empty-state';
import { ChevronRight } from '@/components/ui/icons';
import { ListSection } from '@/components/ui/list';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useHydrated } from '@/lib/hooks';
import { useHistoryStore, type HistoryEntry } from '@/lib/local-stores';
import { useOrderHistoryQuery } from '@/lib/queries';

function HistoryRow({ entry, summary }: { entry: HistoryEntry; summary?: OrderSummaryDto }) {
  const active = summary ? !isFinalStatus(summary.status) : false;
  return (
    <Link href={`/pesanan/${entry.token}`} className="tap-row flex items-center gap-3 px-4 py-3">
      <span className="flex w-2.5 shrink-0 justify-center" aria-hidden="true">
        {active && <span className="size-2.5 animate-pulse-dot rounded-full bg-orange" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2">
          <span className="font-rounded text-headline">{entry.code}</span>
          {summary && <span className="text-subhead font-bold tabular-nums">{formatRupiah(summary.total)}</span>}
        </span>
        <span className="truncate text-footnote text-label-2">
          {formatDateTimeWIB(summary?.createdAt ?? entry.createdAt)}
          {summary ? ` · ${summary.itemSummary}` : ''}
        </span>
        {summary ? (
          <StatusBadge status={summary.status} className="mt-1 self-start" />
        ) : (
          <span className="mt-1 text-footnote text-label-3">Status belum termuat</span>
        )}
      </span>
      <ChevronRight size={18} className="shrink-0 text-label-3" aria-hidden="true" />
    </Link>
  );
}

/** Riwayat pesanan di HP ini (PRD 6.7): yang masih berjalan selalu di atas. */
export function HistoryView() {
  const hydrated = useHydrated();
  const entries = useHistoryStore((state) => state.entries);
  const visibleEntries = hydrated ? entries : [];
  const tokens = visibleEntries.map((entry) => entry.token);
  const { data, isPending } = useOrderHistoryQuery(tokens);
  const summaries = new Map(data?.orders.map((order) => [order.token, order]));

  const sorted = [...visibleEntries].sort((a, b) => {
    const activeA = summaries.get(a.token) && !isFinalStatus(summaries.get(a.token)!.status) ? 1 : 0;
    const activeB = summaries.get(b.token) && !isFinalStatus(summaries.get(b.token)!.status) ? 1 : 0;
    return activeB - activeA || Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  return (
    <>
      <PageHeader title="Riwayat Pesanan">
        <p className="text-subhead text-label-2">Riwayat tersimpan di HP ini saja.</p>
      </PageHeader>
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 lg:px-6">
        {!hydrated || (tokens.length > 0 && isPending) ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-20 rounded-section" />
            <Skeleton className="h-20 rounded-section" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            art={<BowlArt variant="mie-ayam" size={104} spoon={false} className="opacity-70 grayscale" />}
            title="Belum ada pesanan di HP ini"
            message="Pesanan yang kamu buat dari HP ini akan muncul di sini."
            action={
              <ButtonLink href="/menu" fullWidth>
                Mulai Pesan
              </ButtonLink>
            }
          />
        ) : (
          <ListSection>
            {sorted.map((entry) => (
              <HistoryRow key={entry.token} entry={entry} summary={summaries.get(entry.token)} />
            ))}
          </ListSection>
        )}
        <Link href="/cek-pesanan" className="tap self-center py-2 text-center text-subhead text-tint">
          Pesananmu tidak ada di sini? Cek pakai kode pesanan.
        </Link>
      </div>
    </>
  );
}
