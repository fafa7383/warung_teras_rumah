'use client';

import type { UploadImageResponse, UploadKind } from '@wtr/shared';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Trash2 } from '@/components/ui/icons';
import { adminFetch } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { compressImage } from '@/lib/device';
import { toast } from '@/lib/toast-store';

const ASPECTS = { menu: 'aspect-square', banner: 'aspect-[2/1]', logo: 'aspect-square', qris: 'aspect-[3/4]' } as const;

/** Pilih foto dari kamera/galeri → kompres di HP → upload (server memotong & mengubah ke WebP). */
export function ImageUploadField({
  kind,
  value,
  onChange,
  emptyLabel = 'Belum ada foto',
  className,
}: {
  kind: UploadKind;
  value: string | null;
  onChange: (url: string | null) => void;
  emptyLabel?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 2000, 0.9);
      const body = new FormData();
      body.append('file', compressed);
      const result = await adminFetch<UploadImageResponse>(`/uploads/image?kind=${kind}`, { method: 'POST', body });
      onChange(result.url);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Upload foto gagal, coba lagi ya');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        className={cn(
          'relative mx-auto flex w-full items-center justify-center overflow-hidden rounded-section bg-canvas',
          ASPECTS[kind],
          kind === 'menu' || kind === 'logo' ? 'max-w-[240px]' : kind === 'qris' ? 'max-w-[260px]' : '',
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className={cn('size-full', kind === 'qris' || kind === 'logo' ? 'object-contain' : 'object-cover')} />
        ) : (
          <span className="text-subhead text-label-2">{emptyLabel}</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          void upload(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <div className="flex justify-center gap-2">
        <Button
          size="md"
          variant="tinted"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
          icon={<Camera size={18} aria-hidden="true" />}
        >
          {value ? 'Ganti Foto' : 'Pilih Foto'}
        </Button>
        {value && (
          <Button
            size="md"
            variant="gray"
            onClick={() => onChange(null)}
            icon={<Trash2 size={18} aria-hidden="true" />}
            className="text-red-text"
          >
            Hapus
          </Button>
        )}
      </div>
    </div>
  );
}

const rupiahDigits = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** Input angka dengan format Rp otomatis (PRD 8.4). */
export function RupiahInput({
  value,
  onChange,
  id,
  invalid,
  describedBy,
  placeholder = '0',
  prefix = 'Rp',
}: {
  value: number | null | undefined;
  onChange: (value: number) => void;
  id?: string;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
  prefix?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-body text-label-2">{prefix}</span>
      <input
        id={id}
        inputMode="numeric"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        placeholder={placeholder}
        value={value ? rupiahDigits.format(value) : ''}
        onChange={(event) => onChange(Number(event.target.value.replace(/\D/g, '').slice(0, 9) || 0))}
        className="w-full bg-transparent py-1 text-body text-label tabular-nums outline-none placeholder:text-label-3"
      />
    </div>
  );
}

export function SelectInput({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none bg-transparent py-1 text-body text-label outline-none"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
