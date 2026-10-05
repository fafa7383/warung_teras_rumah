'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { orderLookupSchema, type OrderLookupResponse } from '@wtr/shared';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { TurnstileField } from '@/components/shop/turnstile-field';
import { Button } from '@/components/ui/button';
import { FieldRow, TextInput } from '@/components/ui/fields';
import { ListSection } from '@/components/ui/list';
import { BackButton, PageHeader } from '@/components/ui/page-header';
import { ApiError, apiFetch } from '@/lib/api-client';
import { useHistoryStore } from '@/lib/local-stores';
import { toast } from '@/lib/toast-store';

// Captcha diisi lewat widget, bukan isian form.
const lookupFormSchema = orderLookupSchema.omit({ turnstileToken: true });
type LookupFormInput = z.input<typeof lookupFormSchema>;
type LookupFormValues = z.output<typeof lookupFormSchema>;

/** Cari pesanan dari HP lain pakai kode + nomor WA (PRD 6.8). */
export function LookupView() {
  const router = useRouter();
  const addHistory = useHistoryStore((state) => state.add);
  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const [token, setToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, formState } = useForm<LookupFormInput, unknown, LookupFormValues>({
    resolver: zodResolver(lookupFormSchema),
    mode: 'onTouched',
    defaultValues: { code: '', customerPhone: '' },
  });

  const onSubmit = async (values: LookupFormValues) => {
    if (!token) {
      toast.info('Tunggu captcha selesai dulu ya');
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<OrderLookupResponse>('/api/orders/lookup', {
        method: 'POST',
        body: JSON.stringify({ ...values, turnstileToken: token }),
      });
      addHistory({ token: result.token, code: result.code, createdAt: result.createdAt });
      router.push(`/pesanan/${result.token}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Ada kendala, coba lagi ya');
      setToken(null);
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Cek Pesanan" leading={<BackButton fallbackHref="/riwayat" />}>
        <p className="text-subhead text-label-2">Masukkan kode pesanan dan nomor WhatsApp yang dipakai saat memesan.</p>
      </PageHeader>
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-2xl flex-col gap-6 px-4 lg:px-6">
        <ListSection>
          <FieldRow label="Kode pesanan" error={formState.errors.code?.message}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                placeholder="WTR-XXXXX"
                autoCapitalize="characters"
                autoComplete="off"
                maxLength={9}
                className="uppercase"
                {...register('code')}
              />
            )}
          </FieldRow>
          <FieldRow label="Nomor WhatsApp" error={formState.errors.customerPhone?.message}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xx-xxxx-xxxx"
                {...register('customerPhone')}
              />
            )}
          </FieldRow>
        </ListSection>
        <TurnstileField ref={turnstileRef} onToken={setToken} />
        <Button type="submit" fullWidth loading={submitting}>
          Cari Pesanan
        </Button>
      </form>
    </>
  );
}
