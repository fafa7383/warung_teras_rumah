'use client';

import {
  MAX_ACTIVE_BANNERS,
  type AdminBannerDto,
  type AdminCategoryDto,
  type BannerInput,
  type BannerTargetType,
  type CategoryInput,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { Reorder, useDragControls } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { FoodArt } from '@/components/brand/food-art';
import { WarungLoader } from '@/components/brand/warung-loader';
import { Button } from '@/components/ui/button';
import { SegmentedControl, Switch } from '@/components/ui/controls';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldRow, TextInput } from '@/components/ui/fields';
import { GripVertical, Plus, Trash2 } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { Sheet, SheetBody, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { adminFetch, adminKeys, useAdminBanners, useAdminCategories, useAdminMenu } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast-store';
import { ImageUploadField, SelectInput } from './form-fields';
import { SubpageHeader } from './settings-store';

const CATEGORY_ICONS = [
  { value: 'bakso', label: 'Bakso' },
  { value: 'mie-ayam', label: 'Mie Ayam' },
  { value: 'seblak', label: 'Seblak' },
  { value: 'jajanan', label: 'Jajanan' },
  { value: 'minuman', label: 'Minuman' },
];

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Ada kendala, coba lagi ya';
}

function DragRow<T>({ value, onDragEnd, children }: { value: T; onDragEnd: () => void; children: ReactNode }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={value}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      className="relative flex items-center bg-surface"
      whileDrag={{ scale: 1.02, boxShadow: '0 10px 30px rgb(0 0 0 / 0.15)', zIndex: 10 }}
    >
      <button
        type="button"
        onPointerDown={(event) => controls.start(event)}
        className="flex h-full w-10 shrink-0 cursor-grab touch-none items-center justify-center pl-2 text-label-3"
        aria-label="Geser untuk mengubah urutan"
      >
        <GripVertical size={20} aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </Reorder.Item>
  );
}

// ---------- Banner ----------

const EMPTY_BANNER: BannerInput = { title: '', imageUrl: '', targetType: 'NONE', targetId: null, isActive: true };

function BannerSheet({
  banner,
  open,
  onClose,
}: {
  banner: AdminBannerDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: categories } = useAdminCategories();
  const { data: menu } = useAdminMenu();
  const [form, setForm] = useState<BannerInput>(() => (banner ? { ...banner } : EMPTY_BANNER));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const targets =
    form.targetType === 'CATEGORY'
      ? (categories ?? []).map((c) => ({ value: c.id, label: c.name }))
      : (menu?.items ?? []).map((item) => ({ value: item.id, label: item.name }));

  const submit = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ ...form, targetId: form.targetType === 'NONE' ? null : form.targetId });
      await adminFetch(banner ? `/banners/${banner.id}` : '/banners', { method: banner ? 'PATCH' : 'POST', body });
      await queryClient.invalidateQueries({ queryKey: adminKeys.banners });
      toast.success('Banner disimpan');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!banner) return;
    try {
      await adminFetch(`/banners/${banner.id}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: adminKeys.banners });
      toast.success('Banner dihapus');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const valid = form.title.trim().length > 0 && form.imageUrl && (form.targetType === 'NONE' || form.targetId);

  return (
    <Sheet open={open} onClose={onClose} label={banner ? 'Ubah banner' : 'Banner baru'} size="large">
      <SheetHeader title={banner ? 'Ubah Banner' : 'Banner Baru'} onClose={onClose} />
      <SheetBody className="flex flex-col gap-6 px-4 pb-4">
        <ListSection header="Gambar 2:1">
          <div className="p-4">
            <ImageUploadField
              kind="banner"
              value={form.imageUrl || null}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url ?? '' }))}
            />
          </div>
        </ListSection>
        <ListSection header="Detail">
          <FieldRow label="Judul internal">
            {({ id }) => (
              <TextInput id={id} value={form.title} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            )}
          </FieldRow>
          <div className="flex flex-col gap-2 px-4 py-3">
            <span className="text-footnote text-label-2">Saat banner di-tap</span>
            <SegmentedControl<BannerTargetType>
              label="Tujuan banner"
              value={form.targetType}
              onChange={(targetType) => setForm((f) => ({ ...f, targetType, targetId: null }))}
              options={[
                { value: 'NONE', label: 'Tidak ada' },
                { value: 'CATEGORY', label: 'Kategori' },
                { value: 'MENU', label: 'Menu' },
              ]}
            />
          </div>
          {form.targetType !== 'NONE' && (
            <FieldRow label={form.targetType === 'CATEGORY' ? 'Kategori tujuan' : 'Menu tujuan'}>
              {({ id }) => (
                <SelectInput
                  id={id}
                  value={form.targetId ?? ''}
                  onChange={(targetId) => setForm((f) => ({ ...f, targetId }))}
                  options={targets}
                  placeholder="Pilih"
                />
              )}
            </FieldRow>
          )}
          <ListRow
            title="Aktif"
            subtitle={`Maksimal ${MAX_ACTIVE_BANNERS} banner aktif`}
            trailing={<Switch checked={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} label="Banner aktif" />}
          />
        </ListSection>
        {banner && (
          <Button variant="destructive-tinted" fullWidth onClick={() => setConfirmDelete(true)}>
            Hapus Banner
          </Button>
        )}
      </SheetBody>
      <SheetFooter>
        <Button fullWidth loading={saving} disabled={!valid} onClick={submit}>
          Simpan
        </Button>
      </SheetFooter>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus banner ini?"
        actions={[
          { label: 'Batal', style: 'cancel', onPress: () => setConfirmDelete(false) },
          { label: 'Hapus', style: 'destructive', onPress: () => void remove() },
        ]}
      />
    </Sheet>
  );
}

export function BannerSettings() {
  const queryClient = useQueryClient();
  const { data: banners, isPending } = useAdminBanners();
  const [ordered, setOrdered] = useState<AdminBannerDto[] | null>(null);
  const [editing, setEditing] = useState<{ banner: AdminBannerDto | null } | null>(null);
  const list = ordered ?? banners ?? [];

  const toggle = async (banner: AdminBannerDto, isActive: boolean) => {
    try {
      await adminFetch(`/banners/${banner.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...banner, isActive }),
      });
      await queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const saveOrder = async () => {
    if (!ordered) return;
    try {
      await adminFetch('/banners/reorder', { method: 'PATCH', body: JSON.stringify({ ids: ordered.map((b) => b.id) }) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.banners });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setOrdered(null);
    }
  };

  return (
    <>
      <SubpageHeader title="Banner Promo" />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2">
        {isPending ? (
          <WarungLoader topic="pengaturan" />
        ) : list.length === 0 ? (
          <EmptyState title="Belum ada banner" message="Banner tampil di Home pembeli, geser otomatis tiap 4 detik." />
        ) : (
          <ListSection header="Urutan tampil" footer="Tahan ⋮⋮ lalu geser untuk mengubah urutan.">
            <Reorder.Group axis="y" values={list} onReorder={setOrdered} className="list-separators">
              {list.map((banner) => (
                <DragRow key={banner.id} value={banner} onDragEnd={() => void saveOrder()}>
                  <div className="flex items-center gap-3 py-2.5 pr-4">
                    <button type="button" onClick={() => setEditing({ banner })} className="tap flex min-w-0 flex-1 items-center gap-3 text-left">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banner.imageUrl} alt="" className="h-9 w-[72px] shrink-0 rounded-[8px] bg-canvas object-cover" />
                      <span className={cn('truncate text-body', !banner.isActive && 'text-label-2')}>{banner.title}</span>
                    </button>
                    <Switch checked={banner.isActive} onChange={(value) => void toggle(banner, value)} label={`${banner.title} aktif`} />
                  </div>
                </DragRow>
              ))}
            </Reorder.Group>
          </ListSection>
        )}
        <Button variant="tinted" fullWidth icon={<Plus size={20} aria-hidden="true" />} onClick={() => setEditing({ banner: null })}>
          Tambah Banner
        </Button>
      </div>
      {editing && (
        <BannerSheet key={editing.banner?.id ?? 'new'} banner={editing.banner} open onClose={() => setEditing(null)} />
      )}
    </>
  );
}

// ---------- Kategori ----------

function CategorySheet({ category, onClose }: { category: AdminCategoryDto | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoryInput>(() =>
    category ? { name: category.name, icon: category.icon, isActive: category.isActive } : { name: '', icon: 'bakso', isActive: true },
  );
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.categories });
    await queryClient.invalidateQueries({ queryKey: adminKeys.menu });
  };

  const submit = async () => {
    setSaving(true);
    try {
      await adminFetch(category ? `/categories/${category.id}` : '/categories', {
        method: category ? 'PATCH' : 'POST',
        body: JSON.stringify(form),
      });
      await refresh();
      toast.success('Kategori disimpan');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!category) return;
    try {
      await adminFetch(`/categories/${category.id}`, { method: 'DELETE' });
      await refresh();
      toast.success('Kategori dihapus');
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Sheet open onClose={onClose} label={category ? 'Ubah kategori' : 'Kategori baru'}>
      <SheetHeader title={category ? 'Ubah Kategori' : 'Kategori Baru'} onClose={onClose} />
      <SheetBody className="flex flex-col gap-6 px-4 pb-4">
        <ListSection>
          <FieldRow label="Nama kategori">
            {({ id }) => (
              <TextInput id={id} value={form.name} maxLength={40} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            )}
          </FieldRow>
          <ListRow
            title="Tampil di pembeli"
            trailing={<Switch checked={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} label="Tampil" />}
          />
        </ListSection>
        <ListSection header="Ikon">
          <div className="grid grid-cols-5 gap-2 p-3">
            {CATEGORY_ICONS.map((icon) => (
              <button
                key={icon.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, icon: icon.value }))}
                aria-pressed={form.icon === icon.value}
                aria-label={icon.label}
                className={cn(
                  'tap flex aspect-square items-center justify-center rounded-section ring-2',
                  form.icon === icon.value ? 'bg-tint-soft ring-tint' : 'bg-canvas ring-transparent',
                )}
              >
                <FoodArt kind={icon.value} size={40} />
              </button>
            ))}
          </div>
        </ListSection>
        {category && (
          <Button
            variant="destructive-tinted"
            fullWidth
            icon={<Trash2 size={18} aria-hidden="true" />}
            onClick={() => void remove()}
            disabled={category.itemCount > 0}
          >
            {category.itemCount > 0 ? 'Kosongkan menu dulu untuk menghapus' : 'Hapus Kategori'}
          </Button>
        )}
      </SheetBody>
      <SheetFooter>
        <Button fullWidth loading={saving} disabled={!form.name.trim()} onClick={submit}>
          Simpan
        </Button>
      </SheetFooter>
    </Sheet>
  );
}

export function CategorySettings() {
  const queryClient = useQueryClient();
  const { data: categories, isPending } = useAdminCategories();
  const [ordered, setOrdered] = useState<AdminCategoryDto[] | null>(null);
  const [editing, setEditing] = useState<{ category: AdminCategoryDto | null } | null>(null);
  const list = ordered ?? categories ?? [];

  const toggle = async (category: AdminCategoryDto, isActive: boolean) => {
    try {
      await adminFetch(`/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: category.name, icon: category.icon, isActive }),
      });
      await queryClient.invalidateQueries({ queryKey: adminKeys.categories });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const saveOrder = async () => {
    if (!ordered) return;
    try {
      await adminFetch('/categories/reorder', { method: 'PATCH', body: JSON.stringify({ ids: ordered.map((c) => c.id) }) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.categories });
      await queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setOrdered(null);
    }
  };

  return (
    <>
      <SubpageHeader title="Kategori Menu" />
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2">
        {isPending ? (
          <WarungLoader topic="pengaturan" />
        ) : (
          <ListSection header="Urutan tampil" footer="Kategori yang disembunyikan tidak tampil di pembeli, menunya ikut tersembunyi.">
            <Reorder.Group axis="y" values={list} onReorder={setOrdered} className="list-separators">
              {list.map((category) => (
                <DragRow key={category.id} value={category} onDragEnd={() => void saveOrder()}>
                  <div className="flex items-center gap-3 py-2 pr-4">
                    <button
                      type="button"
                      onClick={() => setEditing({ category })}
                      className="tap flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <FoodArt kind={category.icon} size={36} />
                      <span className="min-w-0">
                        <span className={cn('block truncate text-body', !category.isActive && 'text-label-2')}>{category.name}</span>
                        <span className="block text-footnote text-label-2">{category.itemCount} menu</span>
                      </span>
                    </button>
                    <Switch checked={category.isActive} onChange={(value) => void toggle(category, value)} label={`${category.name} tampil`} />
                  </div>
                </DragRow>
              ))}
            </Reorder.Group>
          </ListSection>
        )}
        <Button variant="tinted" fullWidth icon={<Plus size={20} aria-hidden="true" />} onClick={() => setEditing({ category: null })}>
          Tambah Kategori
        </Button>
      </div>
      {editing && <CategorySheet key={editing.category?.id ?? 'new'} category={editing.category} onClose={() => setEditing(null)} />}
    </>
  );
}
