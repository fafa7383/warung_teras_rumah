import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';
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
    'tap relative inline-flex shrink-0 select-none items-center justify-center rounded-full whitespace-nowrap',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

type ButtonProps = ComponentProps<'button'> & StyleProps & { loading?: boolean; icon?: ReactNode };

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
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 18} /> : icon}
      {children}
    </button>
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
}: ComponentProps<'button'> & { label: string; variant?: 'glass' | 'fill' | 'tint' }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'tap inline-flex size-11 shrink-0 items-center justify-center rounded-full',
        variant === 'glass' && 'glass-strong text-label',
        variant === 'fill' && 'bg-fill text-label',
        variant === 'tint' && 'bg-tint text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
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
