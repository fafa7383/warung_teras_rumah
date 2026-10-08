'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import { RollingNumber } from '@/components/motion/animated-number';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { Minus, Plus } from './icons';

/** Switch iOS 51 × 31: tombol bulat meluncur dengan pegas. */
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
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      animate={{ backgroundColor: checked ? '#34C759' : 'rgba(120,120,128,0.2)' }}
      transition={{ duration: 0.2 }}
      whileTap={disabled ? undefined : 'pressed'}
      className="relative flex h-[31px] w-[51px] shrink-0 items-center rounded-full p-[2px] disabled:opacity-40"
    >
      <motion.span
        layout
        transition={spring.snappy}
        variants={{ pressed: { width: 33 } }}
        initial={false}
        style={{ marginLeft: checked ? 'auto' : 0 }}
        className="block h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)]"
      />
    </motion.button>
  );
}

/** Stepper kapsul "− 1 +": angka bergulir naik/turun, tombol memantul saat ditekan. */
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
  const [direction, setDirection] = useState<1 | -1>(1);
  const buttonSize = size === 'sm' ? 'size-8' : 'size-9';
  const change = (delta: 1 | -1) => {
    setDirection(delta);
    onChange(value + delta);
  };

  return (
    <div className="inline-flex items-center rounded-full bg-fill p-0.5" role="group" aria-label={label}>
      <motion.button
        type="button"
        aria-label={`Kurangi ${label}`}
        onClick={() => change(-1)}
        disabled={value <= min}
        whileTap={{ scale: 0.8 }}
        transition={spring.snappy}
        className={cn('flex items-center justify-center rounded-full text-label disabled:text-label-3', buttonSize)}
      >
        <Minus size={18} strokeWidth={2.4} aria-hidden="true" />
      </motion.button>
      <span className="sr-only" aria-live="polite">
        {value}
      </span>
      <RollingNumber value={value} direction={direction} className="min-w-7 justify-center text-headline" />
      <motion.button
        type="button"
        aria-label={`Tambah ${label}`}
        onClick={() => change(1)}
        disabled={value >= max}
        whileTap={{ scale: 0.8 }}
        transition={spring.snappy}
        className={cn('flex items-center justify-center rounded-full text-label disabled:text-label-3', buttonSize)}
      >
        <Plus size={18} strokeWidth={2.4} aria-hidden="true" />
      </motion.button>
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
          <motion.button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            whileTap={{ scale: 0.96 }}
            className="relative min-h-8 flex-1 rounded-[8px] px-2 text-footnote font-semibold"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[8px] bg-white shadow-[0_3px_8px_rgb(0_0_0/0.12),0_0_0_0.5px_rgb(0_0_0/0.04)]"
                transition={spring.smooth}
              />
            )}
            <span className={cn('relative transition-colors duration-200', active ? 'text-label' : 'text-label-2')}>
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

/** Centang yang tergambar dengan pegas saat dipilih. */
function AnimatedCheck({ size, strokeWidth }: { size: number; strokeWidth: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.4, opacity: 0 }}
      transition={spring.bouncy}
      aria-hidden="true"
    >
      <motion.path
        d="M5 12.5l4.5 4.5L19 7.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      />
    </motion.svg>
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
        <motion.span
          animate={{
            backgroundColor: selected ? '#D63C3C' : 'rgba(255,255,255,0)',
            borderColor: selected ? '#D63C3C' : '#AEAEB2',
            scale: selected ? [1, 1.15, 1] : 1,
          }}
          transition={{ duration: 0.25 }}
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] text-white"
        >
          <AnimatePresence initial={false}>
            {selected && <AnimatedCheck key="check" size={14} strokeWidth={3.4} />}
          </AnimatePresence>
        </motion.span>
      ) : (
        <span className="flex size-[22px] shrink-0 items-center justify-center text-tint">
          <AnimatePresence initial={false}>
            {selected && <AnimatedCheck key="check" size={20} strokeWidth={2.8} />}
          </AnimatePresence>
        </span>
      )}
    </button>
  );
}
