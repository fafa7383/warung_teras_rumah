'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  OPTION_GROUP_TEMPLATES,
  menuItemInputSchema,
  type AdminMenuItemDto,
  type MenuItemInput,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useFieldArray, useForm, type Control, type FieldErrors, type UseFormRegister } from 'react-hook-form';
import type { z } from 'zod';
import { BowlLoader } from '@/components/brand/food-art';
import { Button } from '@/components/ui/button';
import { SegmentedControl, Stepper, Switch } from '@/components/ui/controls';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldRow, TextArea, TextInput } from '@/components/ui/fields';
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { BackButton, PageHeader } from '@/components/ui/page-header';
import { Sheet, SheetBody, SheetHeader } from '@/components/ui/sheet';
import { adminFetch, adminKeys, useAdminMenu, useAdminMenuItem } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast-store';
import { ImageUploadField, RupiahInput, SelectInput } from './form-fields';

type MenuFormValues = z.output<typeof menuItemInputSchema>;

const EMPTY_MENU: MenuItemInput = {
  name: '',
  categoryId: '',
  description: '',
  basePrice: 0,
  imageUrl: null,
  isAvailable: true,
  isFavorite: false,
  isRecommended: false,
  optionGroups: [],
};

function toFormValues(item: AdminMenuItemDto): MenuItemInput {
  return {
    name: item.name,
    categoryId: item.categoryId,
    description: item.description ?? '',
    basePrice: item.basePrice,
    imageUrl: item.imageUrl,
    isAvailable: item.isAvailable,
    isFavorite: item.isFavorite,
    isRecommended: item.isRecommended,
    optionGroups: item.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      type: group.type,
      isRequired: group.isRequired,
      maxSelect: group.maxSelect,
      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDelta: option.priceDelta,
        isDefault: option.isDefault,
        isActive: option.isActive,
      })),
    })),
  };
}

function OptionsEditor({
  control,
  register,
  groupIndex,
  errors,
}: {
  control: Control<MenuItemInput, unknown, MenuFormValues>;
  register: UseFormRegister<MenuItemInput>;
  groupIndex: number;
  errors: FieldErrors<MenuItemInput>;
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: `optionGroups.${groupIndex}.options` });
  const groupErrors = errors.optionGroups?.[groupIndex];

  return (
    <div className="list-separators">
      {fields.map((field, optionIndex) => (
        <div key={field.id} className="flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <TextInput
              aria-label="Nama opsi"
              placeholder="Nama opsi"
              aria-invalid={Boolean(groupErrors?.options?.[optionIndex]?.name)}
              {...register(`optionGroups.${groupIndex}.options.${optionIndex}.name`)}
            />
            <button
              type="button"
              aria-label="Naikkan opsi"
              disabled={optionIndex === 0}
              onClick={() => move(optionIndex, optionIndex - 1)}
              className="tap flex size-8 shrink-0 items-center justify-center rounded-full text-label-2 disabled:opacity-30"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Hapus opsi"
              onClick={() => remove(optionIndex)}
              className="tap flex size-8 shrink-0 items-center justify-center rounded-full text-red-text"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="w-36 rounded-control bg-fill px-3">
              <Controller
                control={control}
                name={`optionGroups.${groupIndex}.options.${optionIndex}.priceDelta`}
                render={({ field: priceField }) => (
                  <RupiahInput prefix="+Rp" value={priceField.value} onChange={priceField.onChange} />
                )}
              />
            </div>
            <Controller
              control={control}
              name={`optionGroups.${groupIndex}.options.${optionIndex}.isDefault`}
              render={({ field: defaultField }) => (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={defaultField.value}
                  onClick={() => defaultField.onChange(!defaultField.value)}
                  className="tap flex items-center gap-1.5 text-subhead"
                >
                  <span
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border-[1.5px]',
                      defaultField.value ? 'border-tint bg-tint text-white' : 'border-label-3',
                    )}
                  >
                    {defaultField.value && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                  </span>
                  Default
                </button>
              )}
            />
            <Controller
              control={control}
              name={`optionGroups.${groupIndex}.options.${optionIndex}.isActive`}
              render={({ field: activeField }) => (
                <label className="flex items-center gap-2 text-subhead">
                  Aktif
                  <Switch checked={activeField.value} onChange={activeField.onChange} label="Opsi aktif" />
                </label>
              )}
            />
          </div>
        </div>
      ))}
      <ListRow
        onClick={() => append({ name: '', priceDelta: 0, isDefault: false, isActive: true })}
        chevron={false}
        leading={<Plus size={18} className="text-tint" aria-hidden="true" />}
        title={<span className="text-tint">Tambah Opsi</span>}
      />
      {groupErrors?.options?.message && (
        <p className="px-4 pb-3 text-footnote text-red-text">{groupErrors.options.message}</p>
      )}
    </div>
  );
}

/** Form tambah/ubah menu: foto, data dasar, switch, grup opsi (PRD 8.4, A-07). */
export function MenuFormView({ menuId }: { menuId?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: menu } = useAdminMenu();
  const existing = useAdminMenuItem(menuId ?? null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<MenuItemInput, unknown, MenuFormValues>({
    resolver: zodResolver(menuItemInputSchema),
    defaultValues: EMPTY_MENU,
    values: existing.data ? toFormValues(existing.data) : undefined,
    resetOptions: { keepDirtyValues: true },
  });
  const { register, control, handleSubmit, watch, formState } = form;
  const groups = useFieldArray({ control, name: 'optionGroups' });
  const errors = formState.errors;

  if (menuId && existing.isPending) return <BowlLoader label="Memuat menu…" />;
  if (menuId && existing.isError) return <EmptyState title="Menu tidak ditemukan" />;

  const save = async (values: MenuFormValues) => {
    try {
      await adminFetch<AdminMenuItemDto>(menuId ? `/menu/${menuId}` : '/menu', {
        method: menuId ? 'PATCH' : 'POST',
        body: JSON.stringify(values),
      });
      await queryClient.invalidateQueries({ queryKey: adminKeys.menu });
      if (menuId) await queryClient.invalidateQueries({ queryKey: adminKeys.menuItem(menuId) });
      toast.success(menuId ? 'Perubahan disimpan' : 'Menu baru ditambahkan');
      router.replace('/admin/menu');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menyimpan, coba lagi ya');
    }
  };

  const deleteMenu = async () => {
    if (!menuId) return;
    setDeleting(true);
    try {
      await adminFetch(`/menu/${menuId}`, { method: 'DELETE' });
      await queryClient.invalidateQueries({ queryKey: adminKeys.menu });
      toast.success('Menu dihapus');
      router.replace('/admin/menu');
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Gagal menghapus');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const categories = (menu?.categories ?? []).map((c) => ({ value: c.id, label: c.isActive ? c.name : `${c.name} (disembunyikan)` }));

  return (
    <>
      <PageHeader
        title={menuId ? 'Ubah Menu' : 'Menu Baru'}
        largeTitle={false}
        leading={<BackButton fallbackHref="/admin/menu" />}
      />
      <form
        noValidate
        onSubmit={handleSubmit(save, () => toast.error('Ada isian yang belum benar, cek lagi ya'))}
        className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-2 pb-32"
      >
        <ListSection header="Foto" footer="Dipotong otomatis 1:1 di tengah dan dikompres ke WebP.">
          <div className="p-4">
            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => <ImageUploadField kind="menu" value={field.value} onChange={field.onChange} />}
            />
          </div>
        </ListSection>

        <ListSection header="Data menu">
          <FieldRow label="Nama" error={errors.name?.message}>
            {({ id, invalid, describedBy }) => (
              <TextInput id={id} aria-invalid={invalid} aria-describedby={describedBy} maxLength={50} {...register('name')} />
            )}
          </FieldRow>
          <FieldRow label="Kategori" error={errors.categoryId?.message}>
            {({ id }) => (
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <SelectInput id={id} value={field.value} onChange={field.onChange} options={categories} placeholder="Pilih kategori" />
                )}
              />
            )}
          </FieldRow>
          <FieldRow label="Deskripsi (opsional)" error={errors.description?.message} hint={`${(watch('description') ?? '').length}/120`}>
            {({ id, invalid, describedBy }) => (
              <TextArea id={id} aria-invalid={invalid} aria-describedby={describedBy} maxLength={120} rows={2} {...register('description')} />
            )}
          </FieldRow>
          <FieldRow label="Harga dasar" error={errors.basePrice?.message}>
            {({ id, invalid }) => (
              <Controller
                control={control}
                name="basePrice"
                render={({ field }) => <RupiahInput id={id} invalid={invalid} value={field.value} onChange={field.onChange} />}
              />
            )}
          </FieldRow>
        </ListSection>

        <ListSection header="Tampil di pembeli">
          {(
            [
              ['isAvailable', 'Tersedia', 'Matikan bila menu habis'],
              ['isFavorite', 'Tandai Favorit', 'Muncul di Paling Laris bila data penjualan kurang'],
              ['isRecommended', 'Tandai Rekomendasi', 'Muncul di "Pilihan Teras Rumah" di Home'],
            ] as const
          ).map(([name, title, subtitle]) => (
            <ListRow
              key={name}
              title={title}
              subtitle={subtitle}
              trailing={
                <Controller
                  control={control}
                  name={name}
                  render={({ field }) => <Switch checked={Boolean(field.value)} onChange={field.onChange} label={title} />}
                />
              }
            />
          ))}
        </ListSection>

        {groups.fields.map((group, groupIndex) => {
          const type = watch(`optionGroups.${groupIndex}.type`);
          return (
            <ListSection
              key={group.id}
              header={`Grup opsi ${groupIndex + 1}`}
              trailing={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Naikkan grup"
                    disabled={groupIndex === 0}
                    onClick={() => groups.move(groupIndex, groupIndex - 1)}
                    className="tap flex size-8 items-center justify-center rounded-full text-label-2 disabled:opacity-30"
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Turunkan grup"
                    disabled={groupIndex === groups.fields.length - 1}
                    onClick={() => groups.move(groupIndex, groupIndex + 1)}
                    className="tap flex size-8 items-center justify-center rounded-full text-label-2 disabled:opacity-30"
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus grup"
                    onClick={() => groups.remove(groupIndex)}
                    className="tap flex size-8 items-center justify-center rounded-full text-red-text"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              }
            >
              <FieldRow label="Nama grup" error={errors.optionGroups?.[groupIndex]?.name?.message}>
                {({ id, invalid }) => (
                  <TextInput id={id} aria-invalid={invalid} placeholder="Contoh: Level Pedas" {...register(`optionGroups.${groupIndex}.name`)} />
                )}
              </FieldRow>
              <div className="px-4 py-3">
                <Controller
                  control={control}
                  name={`optionGroups.${groupIndex}.type`}
                  render={({ field }) => (
                    <SegmentedControl
                      label="Tipe grup"
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        if (value === 'MULTIPLE' && !form.getValues(`optionGroups.${groupIndex}.maxSelect`)) {
                          form.setValue(`optionGroups.${groupIndex}.maxSelect`, 3);
                        }
                      }}
                      options={[
                        { value: 'SINGLE', label: 'Pilih satu' },
                        { value: 'MULTIPLE', label: 'Pilih beberapa' },
                      ]}
                    />
                  )}
                />
              </div>
              <ListRow
                title="Wajib dipilih"
                trailing={
                  <Controller
                    control={control}
                    name={`optionGroups.${groupIndex}.isRequired`}
                    render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Wajib dipilih" />}
                  />
                }
              />
              {type === 'MULTIPLE' && (
                <ListRow
                  title="Maksimal pilihan"
                  trailing={
                    <Controller
                      control={control}
                      name={`optionGroups.${groupIndex}.maxSelect`}
                      render={({ field }) => (
                        <Stepper value={field.value ?? 3} onChange={field.onChange} min={1} max={20} size="sm" label="maksimal pilihan" />
                      )}
                    />
                  }
                />
              )}
              <OptionsEditor control={control} register={register} groupIndex={groupIndex} errors={errors} />
            </ListSection>
          );
        })}

        <Button variant="tinted" fullWidth icon={<Plus size={20} aria-hidden="true" />} onClick={() => setTemplatesOpen(true)}>
          Tambah Grup Opsi
        </Button>

        {menuId && (
          <Button variant="destructive-tinted" fullWidth onClick={() => setConfirmDelete(true)} icon={<Trash2 size={20} aria-hidden="true" />}>
            Hapus Menu
          </Button>
        )}

        <div className="fixed inset-x-0 bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] z-30 flex justify-center px-4 lg:bottom-6 lg:left-60">
          <Button type="submit" fullWidth loading={formState.isSubmitting} className="max-w-[420px] shadow-float">
            Simpan
          </Button>
        </div>
      </form>

      <Sheet open={templatesOpen} onClose={() => setTemplatesOpen(false)} label="Pilih template grup opsi">
        <SheetHeader title="Tambah grup opsi" onClose={() => setTemplatesOpen(false)} />
        <SheetBody className="px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <ListSection footer="Template bisa diedit setelah ditambahkan.">
            {Object.entries(OPTION_GROUP_TEMPLATES).map(([label, template]) => (
              <ListRow
                key={label}
                title={label}
                subtitle={template.options.map((option) => option.name).join(', ')}
                onClick={() => {
                  groups.append(structuredClone(template));
                  setTemplatesOpen(false);
                }}
              />
            ))}
            <ListRow
              title="Grup kosong"
              subtitle="Buat dari awal"
              onClick={() => {
                groups.append({ name: '', type: 'SINGLE', isRequired: false, maxSelect: null, options: [] });
                setTemplatesOpen(false);
              }}
            />
          </ListSection>
        </SheetBody>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus menu ini?"
        message="Menu hilang dari daftar pembeli. Laporan dan pesanan lama tetap aman."
        actions={[
          { label: 'Batal', style: 'cancel', onPress: () => setConfirmDelete(false) },
          { label: 'Hapus', style: 'destructive', onPress: () => void deleteMenu(), loading: deleting },
        ]}
      />
    </>
  );
}
