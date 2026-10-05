'use client';

import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Check, Minus, Plus } from './icons';

/** Switch iOS 51 × 31 dengan warna hijau sistem. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[31px] w-[51px] shrink-0 rounded-full p-[2px] transition-colors duration-200 ease-standard disabled:opacity-40',
        checked ? 'bg-green' : 'bg-fill-2',
      )}
    >
      <span
        className={cn(
          'block size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-transform duration-200 ease-ios',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

/** Stepper kapsul "− 1 +" (PRD 3.6: tombol 36 px). */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  size = 'md',
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  label: string;
}) {
  const buttonSize = size === 'sm' ? 'size-8' : 'size-9';
  return (
    <div className="inline-flex items-center rounded-full bg-fill p-0.5" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Kurangi ${label}`}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={cn('tap flex items-center justify-center rounded-full text-label disabled:text-label-3', buttonSize)}
      >
        <Minus size={18} strokeWidth={2.4} aria-hidden="true" />
      </button>
      <span className="min-w-7 text-center text-headline tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Tambah ${label}`}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={cn('tap flex items-center justify-center rounded-full text-label disabled:text-label-3', buttonSize)}
      >
        <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Segmented control iOS dengan thumb putih yang bergeser. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div role="tablist" aria-label={label} className={cn('flex rounded-[10px] bg-fill p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className="relative min-h-8 flex-1 rounded-[8px] px-2 text-footnote font-semibold"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[8px] bg-white shadow-[0_3px_8px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.04)]"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className={cn('relative', active ? 'text-label' : 'text-label-2')}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Baris pilihan dengan centang ala iOS (radio = centang, checkbox = lingkaran centang). */
export function ChoiceRow({
  selected,
  onSelect,
  title,
  subtitle,
  trailing,
  multiple,
  disabled,
  leading,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  multiple?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
}) {
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className="tap-row flex min-h-11 w-full items-center gap-3 px-4 text-left disabled:opacity-40"
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col py-[11px]">
        <span className="text-body text-label">{title}</span>
        {subtitle && <span className="text-footnote text-label-2">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-subhead text-label-2">{trailing}</span>}
      {multiple ? (
        <span
          className={cn(
            'flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors',
            selected ? 'border-tint bg-tint text-white' : 'border-label-3',
          )}
        >
          {selected && <Check size={14} strokeWidth={3} aria-hidden="true" />}
        </span>
      ) : (
        <span className="flex size-[22px] shrink-0 items-center justify-center text-tint">
          {selected && <Check size={20} strokeWidth={2.6} aria-hidden="true" />}
        </span>
      )}
    </button>
  );
}
