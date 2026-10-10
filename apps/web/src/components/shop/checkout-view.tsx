'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  checkoutFormSchema,
  formatPhoneDisplay,
  formatRupiah,
  normalizePhone,
  type CartValidateResponse,
  type CheckoutFormInput,
  type CheckoutFormValues,
  type CreateOrderResponse,
  type StoreDto,
} from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, type DefaultValues } from 'react-hook-form';
import { BowlArt } from '@/components/brand/food-art';
import { WarungLoader } from '@/components/brand/warung-loader';
import { AnimatedRupiah } from '@/components/motion/animated-number';
import { ConfettiBurst, DrawnCheck, RingPulse } from '@/components/motion/celebration';
import { Button, ButtonLink } from '@/components/ui/button';
import { ChoiceRow, Switch } from '@/components/ui/controls';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldRow, TextArea, TextInput } from '@/components/ui/fields';
import { Armchair, Banknote, Bike, CircleAlert, CircleCheck, Plus, QrCode, type LucideIcon } from '@/components/ui/icons';
import { ListRow, ListSection, RowIcon } from '@/components/ui/list';
import { PageHeader } from '@/components/ui/page-header';
import { Sheet, SheetBody, SheetFooter, SheetHeader } from '@/components/ui/sheet';
import { ApiError, apiFetch } from '@/lib/api-client';
import { cartTotals, useCartStore } from '@/lib/cart-store';
import { cn } from '@/lib/cn';
import { vibrate } from '@/lib/device';
import { useHydrated } from '@/lib/hooks';
import { useCustomerStore, useHistoryStore } from '@/lib/local-stores';
import { riseOrder, spring } from '@/lib/motion';
import { toCartLineInput } from '@/lib/orders-client';
import { queryKeys, useStoreQuery } from '@/lib/queries';
import { toast } from '@/lib/toast-store';
import { CartLineRow } from './cart-line';
import { StoreClosedNotice } from './store-status';
import { TurnstileField } from './turnstile-field';

// Cara pesan & pembayaran sengaja tanpa pilihan default (PRD 6.4).
const EMPTY_FORM: DefaultValues<CheckoutFormInput> = {
  customerName: '',
  customerPhone: '',
  address: '',
  landmark: '',
};

function OrderTypeCard({
  icon: Icon,
  title,
  subtitle,
  selected,
  onSelect,
  buttonRef,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  selected: boolean;
  onSelect: () => void;
  buttonRef?: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <motion.button
      ref={buttonRef}
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      animate={{ boxShadow: selected ? '0 0 0 2px #D63C3C, 0 8px 24px rgba(214,60,60,0.18)' : '0 0 0 0px rgba(214,60,60,0)' }}
      transition={spring.snappy}
      className="relative flex flex-col items-start gap-2.5 rounded-section bg-surface p-4 text-left"
    >
      <motion.span
        animate={{
          backgroundColor: selected ? '#D63C3C' : '#FDECEB',
          color: selected ? '#FFFFFF' : '#D63C3C',
          rotate: selected ? [0, -12, 8, 0] : 0,
          scale: selected ? [1, 1.15, 1] : 1,
        }}
        transition={{ duration: 0.45 }}
        className="flex size-10 items-center justify-center rounded-full"
      >
        <Icon size={22} aria-hidden="true" />
      </motion.span>
      <span>
        <span className="block text-headline">{title}</span>
        <span className="block text-footnote text-label-2">{subtitle}</span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={spring.bouncy}
            className="absolute top-3 right-3 inline-flex"
          >
            <CircleCheck size={22} className="fill-tint text-white" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          className="flex items-center gap-1 px-4 text-footnote text-red-text"
          role="alert"
        >
          <CircleAlert size={14} aria-hidden="true" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Layar perayaan sesaat setelah pesanan berhasil dibuat. */
function OrderPlaced({ code }: { code: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-canvas px-8 text-center">
      <div className="relative flex size-40 items-center justify-center">
        <RingPulse delay={0.25} />
        <ConfettiBurst count={34} />
        <DrawnCheck size={104} />
      </div>
      <motion.h1
        className="mt-6 text-title-1 font-bold"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.45 }}
      >
        Pesananmu sudah kami terima!
      </motion.h1>
      <motion.p
        className="mt-2 text-subhead text-label-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring.gentle, delay: 0.6 }}
      >
        Kode pesanan <span className="font-rounded font-semibold text-label">{code}</span>
      </motion.p>
      <motion.div
        className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-fill"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        aria-hidden="true"
      >
        <motion.div
          className="h-full rounded-full bg-tint"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.1, delay: 0.8, ease: 'easeInOut' }}
        />
      </motion.div>
      <span className="sr-only" role="status">
        Pesanan {code} berhasil dibuat. Membuka halaman pesanan.
      </span>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-2.5">
      <span className={strong ? 'text-headline' : 'text-body text-label-2'}>{label}</span>
      <span className={strong ? 'text-title-3 font-bold' : 'text-body'}>{value}</span>
    </div>
  );
}

export function CheckoutView({ initialStore }: { initialStore: StoreDto | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clear);
  const applyValidation = useCartStore((state) => state.applyValidation);
  const { remember, profile, save: saveProfile, setRemember } = useCustomerStore();
  const addHistory = useHistoryStore((state) => state.add);
  const { data: store } = useStoreQuery(initialStore);

  const turnstileRef = useRef<TurnstileInstance | undefined>(undefined);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [confirmValues, setConfirmValues] = useState<CheckoutFormValues | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ code: string; token: string } | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const form = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onTouched',
    defaultValues: EMPTY_FORM,
  });
  const { register, control, handleSubmit, watch, reset, formState } = form;
  const orderType = watch('orderType');

  // Data pemesan yang disimpan di HP ini otomatis terisi (PRD 6.4).
  const prefilled = useRef(false);
  useEffect(() => {
    if (!hydrated || prefilled.current) return;
    prefilled.current = true;
    if (profile) {
      reset({
        ...EMPTY_FORM,
        customerName: profile.name,
        customerPhone: profile.phone ? formatPhoneDisplay(profile.phone) : '',
        address: profile.address,
        landmark: profile.landmark,
      });
    }
  }, [hydrated, profile, reset]);

  /** Harga & ketersediaan divalidasi ulang ke server saat keranjang dibuka (PRD B-05). */
  const validateCart = useCallback(
    async ({ announceProblems }: { announceProblems: boolean }) => {
      const current = useCartStore.getState().lines;
      if (current.length === 0) return;
      try {
        const result = await apiFetch<CartValidateResponse>('/api/cart/validate', {
          method: 'POST',
          body: JSON.stringify({ items: current.map(toCartLineInput) }),
        });
        const { priceChanged, problems } = applyValidation(
          result,
          current.map((line) => line.key),
        );
        if (priceChanged) toast.info('Ada harga yang berubah, cek lagi ya');
        else if (problems > 0 && announceProblems) toast.error('Ada menu yang habis, hapus dulu ya');
      } catch {
        // Offline: tetap tampilkan isi keranjang; server memeriksa ulang saat pesan.
      }
    },
    [applyValidation],
  );

  const validatedOnce = useRef(false);
  useEffect(() => {
    if (!hydrated || validatedOnce.current) return;
    validatedOnce.current = true;
    void validateCart({ announceProblems: true });
  }, [hydrated, validateCart]);

  const { count, subtotal } = cartTotals(lines);
  const hasBlockedLines = lines.some((line) => line.problem);
  const storeOpen = store?.status.isOpen ?? true;
  const ready = formState.isValid && Boolean(turnstileToken) && !hasBlockedLines && storeOpen;

  const resetCaptcha = () => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  };

  const onValid = (values: CheckoutFormValues) => {
    if (hasBlockedLines) {
      toast.error('Ada menu yang habis, hapus dulu ya');
      return;
    }
    if (!turnstileToken) {
      toast.info('Tunggu captcha selesai dulu ya');
      return;
    }
    setConfirmValues(values);
  };

  const placeOrder = async () => {
    if (!confirmValues || !turnstileToken) return;
    const sent = useCartStore.getState().lines;
    setSubmitting(true);
    try {
      const result = await apiFetch<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...confirmValues,
          items: sent.map(toCartLineInput),
          turnstileToken,
          expectedTotal: cartTotals(sent).subtotal,
        }),
      });

      if (remember) {
        saveProfile({
          name: confirmValues.customerName,
          phone: confirmValues.customerPhone,
          address: confirmValues.address ?? '',
          landmark: confirmValues.landmark ?? '',
        });
      }
      addHistory({ token: result.token, code: result.code, createdAt: new Date().toISOString() });
      vibrate([10, 40, 10]);
      setConfirmValues(null);
      setPlaced({ code: result.code, token: result.token });
      clearCart();
      // Beri waktu animasi perayaan, sambil halaman pesanan dimuat di belakang.
      router.prefetch(`/pesanan/${result.token}`);
      setTimeout(() => router.replace(`/pesanan/${result.token}`), 1900);
    } catch (error) {
      setConfirmValues(null);
      resetCaptcha();
      const code = error instanceof ApiError ? error.code : 'UNKNOWN';
      const message = error instanceof ApiError ? error.message : 'Ada kendala, coba lagi ya';
      if (code === 'ITEMS_INVALID' || code === 'PRICE_CHANGED') {
        await validateCart({ announceProblems: false });
      }
      if (code === 'STORE_CLOSED') await queryClient.invalidateQueries({ queryKey: queryKeys.store });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) return <OrderPlaced code={placed.code} />;

  if (!hydrated) {
    return (
      <>
        <PageHeader title="Keranjang" />
        <WarungLoader topic="keranjang" />
      </>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        <PageHeader title="Keranjang" />
        <EmptyState
          art={<BowlArt variant="bakso" size={112} spoon={false} className="opacity-70 grayscale" />}
          title="Keranjangmu masih kosong"
          message="Yuk pilih bakso, mie ayam, atau seblak favoritmu."
          action={
            <ButtonLink href="/menu" fullWidth>
              Lihat Menu
            </ButtonLink>
          }
        />
      </>
    );
  }

  const isDelivery = orderType === 'DELIVERY';

  return (
    <>
      <PageHeader
        title="Keranjang"
        trailing={
          <Button variant="plain" size="sm" onClick={() => setConfirmClear(true)} className="text-red-text">
            Hapus semua
          </Button>
        }
      />

      <form
        noValidate
        onSubmit={handleSubmit(onValid)}
        className="mx-auto flex max-w-2xl flex-col gap-7 px-4 pb-8 lg:px-6"
      >
        {store && <StoreClosedNotice status={store.status} context="cart" />}

        <ListSection header={`Pesanan · ${count} item`} className="animate-rise" style={riseOrder(0)}>
          <AnimatePresence initial={false}>
            {lines.map((line) => (
              // Item yang dihapus menyusut keluar, baris lain bergeser naik dengan halus.
              <motion.div
                key={line.key}
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0, x: -40 }}
                transition={spring.smooth}
                className="overflow-hidden"
              >
                <CartLineRow line={line} />
              </motion.div>
            ))}
          </AnimatePresence>
          <ListRow
            href="/menu"
            chevron={false}
            leading={<Plus size={20} className="text-tint" aria-hidden="true" />}
            title={<span className="text-tint">Tambah menu lain</span>}
          />
        </ListSection>

        <section className="animate-rise flex flex-col gap-1.5" style={riseOrder(1)}>
          <h2 className="px-4 text-footnote text-label-2 uppercase">Cara Pesan</h2>
          <Controller
            control={control}
            name="orderType"
            render={({ field, fieldState }) => (
              <>
                <div role="radiogroup" aria-label="Cara pesan" className="grid grid-cols-2 gap-3">
                  <OrderTypeCard
                    buttonRef={field.ref}
                    icon={Armchair}
                    title="Makan di Tempat"
                    subtitle="Langsung di warung"
                    selected={field.value === 'DINE_IN'}
                    onSelect={() => field.onChange('DINE_IN')}
                  />
                  <OrderTypeCard
                    icon={Bike}
                    title="Diantar"
                    subtitle="Gratis ongkir"
                    selected={field.value === 'DELIVERY'}
                    onSelect={() => field.onChange('DELIVERY')}
                  />
                </div>
                <FieldError message={fieldState.error?.message} />
              </>
            )}
          />
        </section>

        <ListSection
          header="Data Pemesan"
          footer="Riwayat & data hanya tersimpan di HP ini."
          className="animate-rise"
          style={riseOrder(2)}
        >
          <FieldRow label="Nama" error={formState.errors.customerName?.message}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                autoComplete="name"
                placeholder="Nama kamu"
                maxLength={50}
                {...register('customerName')}
              />
            )}
          </FieldRow>
          <FieldRow
            label="Nomor WhatsApp"
            error={formState.errors.customerPhone?.message}
            hint="Untuk konfirmasi pesanan"
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xx-xxxx-xxxx"
                maxLength={20}
                {...register('customerPhone')}
              />
            )}
          </FieldRow>
          <AnimatePresence initial={false}>
          {isDelivery && (
            // Kolom alamat membuka dengan halus saat memilih "Diantar".
            <motion.div
              key="delivery-fields"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring.smooth}
              className="list-separators overflow-hidden"
            >
              <FieldRow label="Alamat lengkap" error={formState.errors.address?.message}>
                {({ id, describedBy, invalid }) => (
                  <TextArea
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    autoComplete="street-address"
                    placeholder="Nama jalan, nomor rumah, RT/RW"
                    maxLength={200}
                    {...register('address')}
                  />
                )}
              </FieldRow>
              <FieldRow label="Patokan" error={formState.errors.landmark?.message}>
                {({ id, describedBy, invalid }) => (
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    placeholder="Contoh: pagar hijau sebelah masjid"
                    maxLength={100}
                    {...register('landmark')}
                  />
                )}
              </FieldRow>
            </motion.div>
          )}
          </AnimatePresence>
          <ListRow
            title="Simpan data untuk pesanan berikutnya"
            trailing={<Switch checked={remember} onChange={setRemember} label="Simpan data pemesan" />}
          />
        </ListSection>

        <section className="animate-rise flex flex-col gap-1.5" style={riseOrder(3)}>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field, fieldState }) => (
              <>
                <ListSection header="Pembayaran">
                  <div role="radiogroup" aria-label="Metode pembayaran" className="list-separators">
                    <ChoiceRow
                      leading={<RowIcon icon={Banknote} tint="green" />}
                      title="Cash"
                      subtitle={isDelivery ? 'Bayar ke kurir saat pesanan sampai' : 'Bayar di kasir'}
                      selected={field.value === 'CASH'}
                      onSelect={() => field.onChange('CASH')}
                    />
                    <ChoiceRow
                      leading={<RowIcon icon={QrCode} tint="blue" />}
                      title="QRIS"
                      subtitle="Scan, bayar, lalu upload bukti. Batas 10 menit."
                      selected={field.value === 'QRIS'}
                      onSelect={() => field.onChange('QRIS')}
                    />
                  </div>
                </ListSection>
                <FieldError message={fieldState.error?.message} />
              </>
            )}
          />
        </section>

        <ListSection header="Ringkasan" className="animate-rise" style={riseOrder(4)}>
          <SummaryRow label="Subtotal" value={<AnimatedRupiah value={subtotal} />} />
          <SummaryRow label="Ongkir" value={<span className="font-semibold text-green-text">Gratis</span>} />
          <SummaryRow label="Total" value={<AnimatedRupiah value={subtotal} />} strong />
        </ListSection>

        <div className="animate-rise" style={riseOrder(5)}>
          <TurnstileField ref={turnstileRef} onToken={setTurnstileToken} />
        </div>

        <div className="fixed inset-x-0 bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] z-30 flex justify-center px-4 lg:bottom-6">
          <motion.div
            className="w-full max-w-[420px]"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring.smooth, delay: 0.25 }}
          >
            <Button
              type="submit"
              fullWidth
              disabled={!storeOpen}
              aria-disabled={!ready || undefined}
              animate={{ opacity: ready || !storeOpen ? 1 : 0.55 }}
              className={cn('shadow-float', ready && 'shine')}
            >
              {storeOpen ? (
                <>
                  Pesan Sekarang ·&nbsp;
                  <AnimatedRupiah value={subtotal} />
                </>
              ) : (
                'Warung lagi tutup'
              )}
            </Button>
          </motion.div>
        </div>
      </form>

      <Sheet open={confirmValues !== null} onClose={() => !submitting && setConfirmValues(null)} label="Konfirmasi pesanan">
        {confirmValues && (
          <>
            <SheetHeader title="Sudah benar, Kak?" onClose={() => !submitting && setConfirmValues(null)} />
            <SheetBody className="px-4 pb-4">
              <ListSection>
                <ListRow title="Cara pesan" value={ORDER_TYPE_LABELS[confirmValues.orderType]} />
                <ListRow title="Nama" value={confirmValues.customerName} />
                <ListRow
                  title="WhatsApp"
                  value={formatPhoneDisplay(normalizePhone(confirmValues.customerPhone) ?? confirmValues.customerPhone)}
                />
                {confirmValues.orderType === 'DELIVERY' && (
                  <ListRow title="Alamat" subtitle={`${confirmValues.address ?? ''} · Patokan: ${confirmValues.landmark ?? ''}`} />
                )}
                <ListRow title="Pembayaran" value={PAYMENT_METHOD_LABELS[confirmValues.paymentMethod]} />
                <SummaryRow label={`Total · ${count} item`} value={formatRupiah(subtotal)} strong />
              </ListSection>
            </SheetBody>
            <SheetFooter className="flex flex-col gap-2">
              <Button fullWidth loading={submitting} onClick={placeOrder}>
                Ya, Pesan
              </Button>
              <Button fullWidth variant="gray" disabled={submitting} onClick={() => setConfirmValues(null)}>
                Cek Lagi
              </Button>
            </SheetFooter>
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Hapus semua isi keranjang?"
        actions={[
          { label: 'Batal', style: 'cancel', onPress: () => setConfirmClear(false) },
          {
            label: 'Hapus',
            style: 'destructive',
            onPress: () => {
              setConfirmClear(false);
              clearCart();
            },
          },
        ]}
      />
    </>
  );
}
