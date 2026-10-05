'use client';

import { formatRupiah, type AdminMenuItemDto, type AdminMenuResponse } from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Reorder, useDragControls } from 'motion/react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { BowlLoader } from '@/components/brand/food-art';
import { MenuImage } from '@/components/shop/menu-image';
import { Button, ButtonLink } from '@/components/ui/button';
import { Switch } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchField } from '@/components/ui/fields';
import { ChevronRight, GripVertical, Plus } from '@/components/ui/icons';
import { ListSection } from '@/components/ui/list';
import { PageHeader } from '@/components/ui/page-header';
import { adminFetch, adminKeys, useAdminMenu } from '@/lib/admin-api';
import { useAdminLocal } from '@/lib/admin-store';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/lib/hooks';
import { toast } from '@/lib/toast-store';

function MenuRow({ item, onToggle }: { item: AdminMenuItemDto; onToggle: (item: AdminMenuItemDto, value: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <Link href={`/admin/menu/${item.id}`} className="tap flex min-w-0 flex-1 items-center gap-3">
        <span className="relative size-12 shrink-0 overflow-hidden rounded-control bg-canvas">
          <MenuImage src={item.imageUrl} alt="" categorySlug={item.categorySlug} sizes="48px" grayscale={!item.isAvailable} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-body', !item.isAvailable && 'text-label-2')}>{item.name}</span>
          <span className="block text-footnote text-label-2">
            {formatRupiah(item.basePrice)}
            {item.isAvailable ? '' : ' · Habis'}
            {item.isRecommended ? ' · Rekomendasi' : ''}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-label-3" aria-hidden="true" />
      </Link>
      <Switch
        checked={item.isAvailable}
        onChange={(value) => onToggle(item, value)}
        label={`${item.name} tersedia`}
      />
    </div>
  );
}

function ReorderRow({ item }: { item: AdminMenuItemDto }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="relative flex items-center gap-3 bg-surface px-4 py-3"
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgb(0 0 0 / 0.15)', zIndex: 10 }}
    >
      <span className="min-w-0 flex-1 truncate text-body">{item.name}</span>
      <button
        type="button"
        onPointerDown={(event) => controls.start(event)}
        className="flex size-10 cursor-grab touch-none items-center justify-center text-label-3"
        aria-label={`Geser ${item.name}`}
      >
        <GripVertical size={22} aria-hidden="true" />
      </button>
    </Reorder.Item>
  );
}

/** Kelola Menu: cari, chip kategori, switch Tersedia/Habis + Urungkan, mode Atur Urutan (PRD 8.4). */
export function MenuManageView() {
  const queryClient = useQueryClient();
  const { data, isPending } = useAdminMenu();
  const markVisited = useAdminLocal((state) => state.markVisited);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250).toLocaleLowerCase('id').trim();
  const [category, setCategory] = useState<string>('all');
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<Record<string, AdminMenuItemDto[]>>({});
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    markVisited('menu');
  }, [markVisited]);

  const groups = useMemo(() => {
    if (!data) return [];
    return data.categories
      .filter((c) => category === 'all' || c.id === category)
      .map((c) => ({
        category: c,
        items: data.items.filter(
          (item) => item.categoryId === c.id && (!debouncedQuery || item.name.toLocaleLowerCase('id').includes(debouncedQuery)),
        ),
      }))
      .filter((group) => group.items.length > 0 || (!debouncedQuery && category !== 'all'));
  }, [data, category, debouncedQuery]);

  const setAvailability = async (item: AdminMenuItemDto, isAvailable: boolean, silent = false) => {
    // Update optimistis agar switch langsung bergerak.
    queryClient.setQueryData<AdminMenuResponse>(adminKeys.menu, (current) =>
      current ? { ...current, items: current.items.map((i) => (i.id === item.id ? { ...i, isAvailable } : i)) } : current,
    );
    try {
      await adminFetch(`/menu/${item.id}/availability`, { method: 'PATCH', body: JSON.stringify({ isAvailable }) });
      if (!silent) {
        toast.success(`${item.name} ${isAvailable ? 'tersedia lagi' : 'ditandai habis'}`, {
          label: 'Urungkan',
          onClick: () => void setAvailability(item, !isAvailable, true),
        });
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan, coba lagi ya');
    } finally {
      void queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    }
  };

  const startReorder = () => {
    if (!data) return;
    setOrder(Object.fromEntries(data.categories.map((c) => [c.id, data.items.filter((i) => i.categoryId === c.id)])));
    setReordering(true);
  };

  const saveOrder = async () => {
    if (!data) return;
    setSavingOrder(true);
    try {
      const ids = data.categories.flatMap((c) => (order[c.id] ?? []).map((item) => item.id));
      await adminFetch('/menu/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.menu });
      toast.success('Urutan menu disimpan');
      setReordering(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan urutan');
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Menu"
        trailing={
          reordering ? (
            <Button size="sm" loading={savingOrder} onClick={saveOrder}>
              Selesai
            </Button>
          ) : (
            <Button size="sm" variant="gray" onClick={startReorder} disabled={!data}>
              Atur Urutan
            </Button>
          )
        }
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4">
        {!reordering && (
          <>
            <SearchField value={query} onChange={setQuery} placeholder="Cari menu" />
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {[{ id: 'all', name: 'Semua' }, ...(data?.categories ?? [])].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'tap h-9 shrink-0 rounded-full px-4 text-subhead font-semibold',
                    category === c.id ? 'bg-tint-soft text-tint-pressed' : 'bg-surface text-label',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </>
        )}

        {isPending ? (
          <BowlLoader label="Memuat menu…" />
        ) : reordering && data ? (
          <>
            <p className="px-1 text-footnote text-label-2">Tahan ikon ⋮⋮ lalu geser untuk mengubah urutan tampil di pembeli.</p>
            {data.categories.map((c) => (
              <ListSection key={c.id} header={c.name}>
                <Reorder.Group
                  axis="y"
                  values={order[c.id] ?? []}
                  onReorder={(items) => setOrder((current) => ({ ...current, [c.id]: items }))}
                  className="list-separators"
                >
                  {(order[c.id] ?? []).map((item) => (
                    <ReorderRow key={item.id} item={item} />
                  ))}
                </Reorder.Group>
              </ListSection>
            ))}
          </>
        ) : groups.length === 0 ? (
          <EmptyState title="Menu tidak ditemukan" message="Coba kata lain atau tambah menu baru." />
        ) : (
          groups.map(({ category: c, items }) => (
            <ListSection key={c.id} header={`${c.name} · ${items.length}`}>
              {items.length === 0 ? (
                <p className="px-4 py-3 text-subhead text-label-2">Belum ada menu di kategori ini.</p>
              ) : (
                items.map((item) => <MenuRow key={item.id} item={item} onToggle={(i, v) => void setAvailability(i, v)} />)
              )}
            </ListSection>
          ))
        )}
      </div>

      {!reordering && (
        <ButtonLink
          href="/admin/menu/baru"
          className="fixed right-4 bottom-[calc(max(12px,env(safe-area-inset-bottom))+88px)] z-30 shadow-float lg:right-8 lg:bottom-8"
          icon={<Plus size={20} strokeWidth={2.6} aria-hidden="true" />}
        >
          Tambah Menu
        </ButtonLink>
      )}
    </>
  );
}
