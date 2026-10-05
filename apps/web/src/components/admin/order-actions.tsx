'use client';

import {
  REJECTION_REASONS,
  buildStatusUpdateForCustomer,
  buildWhatsAppUrl,
  type AdminOrderDto,
  type AdminOrderListItemDto,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, ButtonLink, type ButtonSize } from '@/components/ui/button';
import { ChoiceRow } from '@/components/ui/controls';
import { ConfirmDialog } from '@/components/ui/dialog';
import { FieldRow, TextInput } from '@/components/ui/fields';
import { MessageCircle } from '@/components/ui/icons';
import { ListSection } from '@/components/ui/list';
import { Sheet, SheetBody, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { adminFetch, adminKeys } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';
import { vibrate } from '@/lib/device';
import { toast } from '@/lib/toast-store';

type OrderLike = Pick<AdminOrderListItemDto, 'id' | 'code' | 'status' | 'paymentMethod' | 'orderType'>;

export interface PrimaryAction {
  kind: 'confirm' | 'advance' | 'open';
  label: string;
  /** Konfirmasi ringan sebelum aksi (PRD A-05). */
  confirmTitle?: string;
}

/** Tombol aksi utama sesuai status (tabel PRD 8.2 & 8.3). */
export function primaryAction(order: OrderLike, place: 'card' | 'detail'): PrimaryAction | null {
  switch (order.status) {
    case 'AWAITING_CONFIRMATION':
      if (order.paymentMethod === 'QRIS') {
        return place === 'card' ? { kind: 'open', label: 'Cek Bukti' } : { kind: 'confirm', label: 'Terima Pembayaran' };
      }
      return { kind: 'confirm', label: 'Konfirmasi' };
    case 'PROCESSING':
      return { kind: 'advance', label: 'Antar Sekarang', confirmTitle: `Antar pesanan ${order.code} sekarang?` };
    case 'DELIVERING':
      return { kind: 'advance', label: 'Tandai Selesai', confirmTitle: `Pesanan ${order.code} sudah sampai?` };
    default:
      return null;
  }
}

export function useOrderMutation(orderId: string) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const run = async (action: 'confirm' | 'advance' | 'reject', body?: unknown): Promise<AdminOrderDto | null> => {
    setPending(true);
    try {
      const updated = await adminFetch<AdminOrderDto>(`/orders/${orderId}/${action}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      queryClient.setQueryData(adminKeys.order(orderId), updated);
      void queryClient.invalidateQueries({ queryKey: adminKeys.orders });
      vibrate(15);
      return updated;
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Ada kendala, coba lagi ya');
      void queryClient.invalidateQueries({ queryKey: adminKeys.orders });
      void queryClient.invalidateQueries({ queryKey: adminKeys.order(orderId) });
      return null;
    } finally {
      setPending(false);
    }
  };
  return { run, pending };
}

const SUCCESS_TEXT: Record<'confirm' | 'advance', string> = {
  confirm: 'Pesanan dikonfirmasi',
  advance: 'Status pesanan diperbarui',
};

/** Tombol aksi utama + dialog konfirmasi ringan bila perlu. */
export function PrimaryActionButton({
  order,
  place,
  size = 'md',
  fullWidth,
  onOpen,
}: {
  order: OrderLike;
  place: 'card' | 'detail';
  size?: ButtonSize;
  fullWidth?: boolean;
  onOpen?: () => void;
}) {
  const action = primaryAction(order, place);
  const { run, pending } = useOrderMutation(order.id);
  const [confirming, setConfirming] = useState(false);
  if (!action) return null;

  const execute = async () => {
    setConfirming(false);
    if (action.kind === 'open') {
      onOpen?.();
      return;
    }
    const updated = await run(action.kind);
    if (updated) toast.success(SUCCESS_TEXT[action.kind]);
  };

  return (
    <>
      <Button
        size={size}
        fullWidth={fullWidth}
        loading={pending}
        variant={action.kind === 'open' ? 'tinted' : 'filled'}
        onClick={() => (action.confirmTitle ? setConfirming(true) : void execute())}
      >
        {action.label}
      </Button>
      {action.confirmTitle && (
        <ConfirmDialog
          open={confirming}
          onClose={() => setConfirming(false)}
          title={action.confirmTitle}
          message="Status pesanan tidak bisa dikembalikan."
          actions={[
            { label: 'Batal', style: 'cancel', onPress: () => setConfirming(false) },
            { label: action.label, style: 'primary', onPress: () => void execute() },
          ]}
        />
      )}
    </>
  );
}

const OTHER = 'Lainnya';

/** Sheet Tolak Pesanan: alasan wajib dipilih (PRD 8.3). */
export function RejectSheet({
  order,
  open,
  onClose,
  webOrigin,
}: {
  order: AdminOrderDto;
  open: boolean;
  onClose: () => void;
  webOrigin: string;
}) {
  const { run, pending } = useOrderMutation(order.id);
  const [choice, setChoice] = useState<string | null>(null);
  const [other, setOther] = useState('');
  const [rejected, setRejected] = useState<AdminOrderDto | null>(null);
  const reason = choice === OTHER ? other.trim() : choice;
  const paidQris = order.paymentMethod === 'QRIS' && order.hasPaymentProof;

  const submit = async () => {
    if (!reason || reason.length < 3) return;
    const updated = await run('reject', { reason });
    if (!updated) return;
    toast.success('Pesanan ditolak');
    if (paidQris) setRejected(updated);
    else onClose();
  };

  const refundText = rejected
    ? buildStatusUpdateForCustomer({
        code: rejected.code,
        customerName: rejected.customerName,
        status: 'REJECTED',
        paymentMethod: rejected.paymentMethod,
        total: rejected.total,
        rejectionReason: rejected.rejectionReason,
        refundNeeded: true,
        link: `${webOrigin}/pesanan/${rejected.token}`,
      })
    : '';

  return (
    <Sheet open={open} onClose={() => !pending && onClose()} label="Tolak pesanan">
      <SheetHeader title={rejected ? 'Jangan lupa refund' : 'Tolak pesanan?'} onClose={onClose} />
      {rejected ? (
        <>
          <SheetBody className="px-4 pb-4">
            <p className="rounded-section bg-orange-soft p-4 text-subhead text-orange-text">
              Pembeli sudah membayar lewat QRIS. Jangan lupa refund manual ke pembeli, lalu kabari lewat WhatsApp.
            </p>
          </SheetBody>
          <SheetFooter className="flex flex-col gap-2">
            <ButtonLink
              href={buildWhatsAppUrl(rejected.customerPhone, refundText)}
              target="_blank"
              rel="noopener noreferrer"
              variant="green"
              fullWidth
              icon={<MessageCircle size={20} aria-hidden="true" />}
            >
              Chat WA Pembeli
            </ButtonLink>
            <Button variant="gray" fullWidth onClick={onClose}>
              Selesai
            </Button>
          </SheetFooter>
        </>
      ) : (
        <>
          <SheetBody className="px-4 pb-4">
            <ListSection header="Alasan" footer="Alasan akan tampil di halaman pesanan pembeli.">
              <div role="radiogroup" aria-label="Alasan penolakan" className="list-separators">
                {[...REJECTION_REASONS, OTHER].map((item) => (
                  <ChoiceRow key={item} title={item} selected={choice === item} onSelect={() => setChoice(item)} />
                ))}
              </div>
              {choice === OTHER && (
                <FieldRow label="Tulis alasan">
                  {({ id }) => (
                    <TextInput
                      id={id}
                      value={other}
                      onChange={(event) => setOther(event.target.value)}
                      maxLength={200}
                      placeholder="Contoh: Gas habis"
                      autoFocus
                    />
                  )}
                </FieldRow>
              )}
            </ListSection>
            {paidQris && (
              <p className="mt-4 rounded-section bg-orange-soft p-3 text-footnote text-orange-text">
                Bukti QRIS sudah diupload. Setelah menolak, lakukan refund manual ke pembeli.
              </p>
            )}
          </SheetBody>
          <SheetFooter>
            <Button
              variant="destructive"
              fullWidth
              loading={pending}
              disabled={!reason || reason.length < 3}
              onClick={submit}
            >
              Tolak Pesanan
            </Button>
          </SheetFooter>
        </>
      )}
    </Sheet>
  );
}
