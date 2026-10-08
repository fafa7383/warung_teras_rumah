'use client';

import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import Link from 'next/link';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { cn } from '@/lib/cn';
import { spring } from '@/lib/motion';
import { Spinner } from './spinner';

export type ButtonVariant =
  | 'filled'
  | 'tinted'
  | 'gray'
  | 'plain'
  | 'destructive'
  | 'destructive-tinted'
  | 'dark'
  | 'green';
export type ButtonSize = 'lg' | 'md' | 'sm';

const VARIANTS: Record<ButtonVariant, string> = {
  filled: 'bg-tint text-white active:bg-tint-pressed disabled:bg-fill-2 disabled:text-label-3',
  tinted: 'bg-tint-soft text-tint-pressed disabled:bg-fill disabled:text-label-3',
  gray: 'bg-fill text-tint-pressed disabled:text-label-3',
  plain: 'bg-transparent text-tint-pressed disabled:text-label-3',
  destructive: 'bg-red-text text-white disabled:bg-fill-2 disabled:text-label-3',
  'destructive-tinted': 'bg-red-soft text-red-text disabled:bg-fill disabled:text-label-3',
  dark: 'bg-label text-white disabled:bg-fill-2 disabled:text-label-3',
  // Hijau gelap agar teks putih tetap lolos kontras AA (tombol WhatsApp).
  green: 'bg-green-text text-white disabled:bg-fill-2 disabled:text-label-3',
};

// Tombol kapsul seperti iOS terbaru; target sentuh minimal 44 px.
const SIZES: Record<ButtonSize, string> = {
  lg: 'h-cta px-6 text-headline gap-2',
  md: 'h-11 px-5 text-subhead font-semibold gap-1.5',
  sm: 'h-8 px-3.5 text-footnote font-semibold gap-1',
};

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function buttonClass({ variant = 'filled', size = 'lg', fullWidth, className }: StyleProps = {}) {
  return cn(
    'tap-scale relative inline-flex shrink-0 select-none items-center justify-center rounded-full whitespace-nowrap transition-[background-color,color,opacity] duration-200',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

type ButtonProps = Omit<HTMLMotionProps<'button'>, 'children' | 'ref'> &
  StyleProps & { loading?: boolean; icon?: ReactNode; children?: ReactNode; ref?: Ref<HTMLButtonElement> };

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <motion.button
      type={type}
      disabled={inactive}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
      whileTap={inactive ? undefined : { scale: size === 'sm' ? 0.94 : 0.97 }}
      transition={spring.snappy}
      {...props}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="inline-flex"
          >
            <Spinner size={size === 'sm' ? 14 : 18} />
          </motion.span>
        ) : icon ? (
          <motion.span key="icon" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex">
            {icon}
          </motion.span>
        ) : null}
      </AnimatePresence>
      {children}
    </motion.button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & StyleProps & { icon?: ReactNode };

export function ButtonLink({ variant, size, fullWidth, icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}

/** Tombol ikon bundar kaca untuk navigation bar (kembali, tutup, aksi). */
export function IconButton({
  label,
  className,
  children,
  variant = 'glass',
  type = 'button',
  ...props
}: Omit<HTMLMotionProps<'button'>, 'children'> & {
  label: string;
  variant?: 'glass' | 'fill' | 'tint';
  children?: ReactNode;
}) {
  return (
    <motion.button
      type={type}
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.86 }}
      transition={spring.snappy}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full',
        variant === 'glass' && 'glass-strong text-label',
        variant === 'fill' && 'bg-fill text-label',
        variant === 'tint' && 'bg-tint text-white',
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function IconLink({
  label,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { label: string }) {
  return (
    <Link
      aria-label={label}
      title={label}
      className={cn('tap glass-strong inline-flex size-11 shrink-0 items-center justify-center rounded-full text-label', className)}
      {...props}
    >
      {children}
    </Link>
  );
}
