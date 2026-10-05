import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ChevronRight, type LucideIcon } from './icons';

/** Inset grouped list ala aplikasi Settings iOS. */
export function ListSection({
  header,
  footer,
  trailing,
  children,
  className,
  id,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('flex flex-col gap-1.5', className)}>
      {(header || trailing) && (
        <div className="flex items-end justify-between gap-3 px-4">
          {header && <h2 className="text-footnote uppercase text-label-2">{header}</h2>}
          {trailing}
        </div>
      )}
      <div className="list-separators overflow-hidden rounded-section bg-surface">{children}</div>
      {footer && <p className="px-4 text-footnote text-label-2">{footer}</p>}
    </section>
  );
}

const ICON_TINTS = {
  red: 'bg-tint',
  green: 'bg-green',
  orange: 'bg-orange',
  blue: 'bg-blue',
  indigo: 'bg-indigo',
  gray: 'bg-gray',
  yellow: 'bg-yellow',
} as const;

export type RowIconTint = keyof typeof ICON_TINTS;

/** Ikon putih dalam kotak membulat berwarna, seperti di Settings. */
export function RowIcon({ icon: Icon, tint = 'gray' }: { icon: LucideIcon; tint?: RowIconTint }) {
  return (
    <span className={cn('flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white', ICON_TINTS[tint])}>
      <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}

interface ListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  value?: ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  className?: string;
  external?: boolean;
}

export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  value,
  href,
  onClick,
  chevron,
  destructive,
  className,
  external,
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(href);
  const content = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col py-[11px]">
        <span className={cn('text-body', destructive ? 'text-red-text' : 'text-label')}>{title}</span>
        {subtitle && <span className="text-footnote text-label-2">{subtitle}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-body text-label-2">{value}</span>}
      {trailing}
      {showChevron && <ChevronRight size={18} className="shrink-0 text-label-3" aria-hidden="true" />}
    </>
  );
  const rowClass = cn('flex min-h-11 w-full items-center gap-3 px-4 text-left', className);

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(rowClass, 'tap-row')}>
        {content}
      </a>
    ) : (
      <Link href={href} className={cn(rowClass, 'tap-row')}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(rowClass, 'tap-row')}>
        {content}
      </button>
    );
  }
  return <div className={rowClass}>{content}</div>;
}
