import { ORDER_STATUS_LABELS, type OrderStatus } from '@wtr/shared';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import {
  Ban,
  ChefHat,
  CircleCheck,
  CircleX,
  Clock,
  Hourglass,
  QrCode,
  Truck,
  type LucideIcon,
} from './icons';

// Status tidak pernah dibedakan hanya dengan warna: selalu ikon + label (PRD 3.1).
export const STATUS_STYLES: Record<OrderStatus, { icon: LucideIcon; badge: string; accent: string }> = {
  AWAITING_PAYMENT: { icon: QrCode, badge: 'bg-orange-soft text-orange-text', accent: 'bg-orange' },
  AWAITING_CONFIRMATION: { icon: Hourglass, badge: 'bg-orange-soft text-orange-text', accent: 'bg-orange' },
  CONFIRMED: { icon: CircleCheck, badge: 'bg-green-soft text-green-text', accent: 'bg-green' },
  PROCESSING: { icon: ChefHat, badge: 'bg-indigo-soft text-indigo-text', accent: 'bg-indigo' },
  DELIVERING: { icon: Truck, badge: 'bg-blue-soft text-blue-text', accent: 'bg-blue' },
  COMPLETED: { icon: CircleCheck, badge: 'bg-green-soft text-green-text', accent: 'bg-green' },
  REJECTED: { icon: CircleX, badge: 'bg-red-soft text-red-text', accent: 'bg-red' },
  EXPIRED: { icon: Clock, badge: 'bg-fill text-label-2', accent: 'bg-gray' },
  CANCELLED: { icon: Ban, badge: 'bg-fill text-label-2', accent: 'bg-gray' },
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { icon: Icon, badge } = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold whitespace-nowrap',
        badge,
        className,
      )}
    >
      <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-caption font-semibold text-label-2 whitespace-nowrap',
        className,
      )}
    >
      {children}
    </span>
  );
}
