import type { CSSProperties, ReactNode } from 'react';
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
      {art && (
        <div className="animate-rise mb-5">
          {/* Ilustrasi melayang pelan agar halaman kosong tetap terasa hidup. */}
          <div className="animate-float motion-reduce:animate-none">{art}</div>
        </div>
      )}
      <h2 className="animate-rise text-title-3 font-bold" style={{ '--i': 1 } as CSSProperties}>
        {title}
      </h2>
      {message && (
        <p className="animate-rise mt-1.5 max-w-xs text-subhead text-label-2" style={{ '--i': 2 } as CSSProperties}>
          {message}
        </p>
      )}
      {action && (
        <div className="animate-rise mt-6 w-full max-w-xs" style={{ '--i': 3 } as CSSProperties}>
          {action}
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}
