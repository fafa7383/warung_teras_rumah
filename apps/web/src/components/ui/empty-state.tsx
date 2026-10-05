import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Ilustrasi + teks + tombol (PRD 3.6). */
export function EmptyState({
  art,
  title,
  message,
  action,
  className,
}: {
  art?: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-8 py-12 text-center', className)}>
      {art && <div className="mb-5">{art}</div>}
      <h2 className="text-title-3 font-bold">{title}</h2>
      {message && <p className="mt-1.5 max-w-xs text-subhead text-label-2">{message}</p>}
      {action && <div className="mt-6 w-full max-w-xs">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}
