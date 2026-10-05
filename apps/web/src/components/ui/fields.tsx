'use client';

import { forwardRef, useId, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { CircleAlert, Search, X } from './icons';

/** Kolom pencarian kapsul abu-abu ala iOS. */
export const SearchField = forwardRef<
  HTMLInputElement,
  Omit<ComponentProps<'input'>, 'onChange' | 'value'> & {
    value: string;
    onChange: (value: string) => void;
    className?: string;
  }
>(function SearchField({ value, onChange, className, placeholder = 'Cari', ...props }, ref) {
  return (
    <div className={cn('flex h-10 items-center gap-2 rounded-full bg-fill px-3.5', className)}>
      <Search size={18} className="shrink-0 text-label-2" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-body text-label outline-none placeholder:text-label-2 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className="tap flex size-6 items-center justify-center rounded-full bg-label-3 text-white"
        >
          <X size={14} strokeWidth={3} aria-hidden="true" />
        </button>
      )}
    </div>
  );
});

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Baris form di dalam ListSection: label kecil di atas, isian di bawah, pesan error dibacakan screen reader. */
export function FieldRow({ label, error, hint, children }: FieldShellProps) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className="flex flex-col px-4 py-2.5">
      <label htmlFor={id} className="text-footnote text-label-2">
        {label}
      </label>
      {children({ id, describedBy: error || hint ? messageId : undefined, invalid: Boolean(error) })}
      {error ? (
        <p id={messageId} role="alert" className="mt-1 flex items-center gap-1 text-footnote text-red-text">
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={messageId} className="mt-0.5 text-footnote text-label-2">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const inputClass =
  'w-full bg-transparent py-1 text-body text-label outline-none placeholder:text-label-3 aria-[invalid=true]:text-red-text';

export const TextInput = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function TextInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(function TextArea(
  { className, ...props },
  ref,
) {
  return <textarea ref={ref} rows={3} className={cn(inputClass, 'resize-none', className)} {...props} />;
});
