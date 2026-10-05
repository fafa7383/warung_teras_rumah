'use client';

import type { AdminSettingsDto, StoreClosureInput } from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChoiceRow, Switch } from '@/components/ui/controls';
import { FieldRow, TextInput } from '@/components/ui/fields';
import { ListSection } from '@/components/ui/list';
import { Sheet, SheetBody, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { adminFetch, adminKeys, useAdminSettings } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast-store';

function statusLine(settings: AdminSettingsDto): string {
  const { status } = settings;
  if (status.isOpen) return `Buka · tutup pukul ${status.closesAt ?? ''}`;
  if (status.reason === 'MANUAL') {
    return status.nextOpenLabel ? `Ditutup manual · buka lagi ${status.nextOpenLabel}` : 'Ditutup manual';
  }
  return status.nextOpenLabel ? `Di luar jam buka · buka ${status.nextOpenLabel}` : 'Di luar jam buka';
}

/** Switch besar "Terima Pesanan" (PRD 8.2, A-08). */
export function StoreClosureControl() {
  const queryClient = useQueryClient();
  const { data: settings } = useAdminSettings();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<'NEXT_OPENING' | 'UNTIL'>('NEXT_OPENING');
  const [until, setUntil] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  if (!settings) return null;
  const accepting = settings.status.reason !== 'MANUAL';

  const save = async (input: StoreClosureInput) => {
    setSaving(true);
    try {
      const updated = await adminFetch<AdminSettingsDto>('/settings/closure', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      queryClient.setQueryData(adminKeys.settings, updated);
      toast.success(input.isManuallyClosed ? 'Pesanan ditutup sementara' : 'Pesanan dibuka lagi');
      setSheetOpen(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Ada kendala, coba lagi ya');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-section bg-surface px-4 py-3 shadow-card">
        <span
          className={cn('size-3 shrink-0 rounded-full', settings.status.isOpen ? 'animate-pulse-dot bg-green' : 'bg-red')}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-headline">Terima Pesanan</p>
          <p className="truncate text-footnote text-label-2">{statusLine(settings)}</p>
        </div>
        <Switch
          checked={accepting}
          label="Terima pesanan"
          disabled={saving}
          onChange={(checked) => (checked ? void save({ isManuallyClosed: false }) : setSheetOpen(true))}
        />
      </div>

      <Sheet open={sheetOpen} onClose={() => !saving && setSheetOpen(false)} label="Tutup pesanan sementara">
        <SheetHeader title="Tutup pesanan sementara" onClose={() => setSheetOpen(false)} />
        <SheetBody className="flex flex-col gap-6 px-4 pb-4">
          <ListSection header="Sampai kapan?">
            <div role="radiogroup" aria-label="Lama tutup" className="list-separators">
              <ChoiceRow
                title="Sampai jam buka berikutnya"
                subtitle="Otomatis buka lagi sesuai jadwal"
                selected={mode === 'NEXT_OPENING'}
                onSelect={() => setMode('NEXT_OPENING')}
              />
              <ChoiceRow title="Sampai jam tertentu" selected={mode === 'UNTIL'} onSelect={() => setMode('UNTIL')} />
            </div>
            {mode === 'UNTIL' && (
              <FieldRow label="Buka lagi pada">
                {({ id }) => (
                  <TextInput id={id} type="datetime-local" value={until} onChange={(event) => setUntil(event.target.value)} />
                )}
              </FieldRow>
            )}
          </ListSection>
          <ListSection header="Pesan untuk pembeli (opsional)">
            <FieldRow label="Pesan">
              {({ id }) => (
                <TextInput
                  id={id}
                  value={message}
                  maxLength={200}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Contoh: Lagi belanja bahan dulu"
                />
              )}
            </FieldRow>
          </ListSection>
        </SheetBody>
        <SheetFooter>
          <Button
            variant="destructive"
            fullWidth
            loading={saving}
            disabled={mode === 'UNTIL' && !until}
            onClick={() =>
              void save({
                isManuallyClosed: true,
                mode,
                closedUntil: mode === 'UNTIL' && until ? new Date(until).toISOString() : null,
                closedMessage: message.trim() || null,
              })
            }
          >
            Tutup Pesanan
          </Button>
        </SheetFooter>
      </Sheet>
    </>
  );
}
