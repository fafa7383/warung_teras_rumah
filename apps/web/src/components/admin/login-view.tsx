'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { adminLoginSchema, type AdminLoginInput, type AdminMeDto } from '@wtr/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/controls';
import { FieldRow, TextInput } from '@/components/ui/fields';
import { Eye, EyeOff } from '@/components/ui/icons';
import { ListRow, ListSection } from '@/components/ui/list';
import { Toaster } from '@/components/ui/toaster';
import { adminFetch, adminKeys } from '@/lib/admin-api';
import { ApiError } from '@/lib/api-client';
import { toast } from '@/lib/toast-store';

type LoginValues = z.output<typeof adminLoginSchema>;

/** Login pemilik: username + password, tampilkan password, "Ingat saya" (PRD 8.1). */
export function LoginView({ next }: { next?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const { register, control, handleSubmit, formState } = useForm<AdminLoginInput, unknown, LoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      const me = await adminFetch<AdminMeDto>('/auth/login', { method: 'POST', body: JSON.stringify(values) });
      queryClient.setQueryData(adminKeys.me, me);
      const target = next?.startsWith('/admin') ? next : '/admin';
      router.replace(target);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Ada kendala, coba lagi ya');
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={72} className="drop-shadow-[0_8px_20px_rgb(225_75_75/0.3)]" />
          <h1 className="mt-5 text-title-1 font-bold">Admin Teras Rumah</h1>
          <p className="mt-1 text-subhead text-label-2">Masuk untuk mengelola pesanan dan menu.</p>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <ListSection>
            <FieldRow label="Username" error={formState.errors.username?.message}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  autoComplete="username"
                  autoCapitalize="none"
                  {...register('username')}
                />
              )}
            </FieldRow>
            <FieldRow label="Password" error={formState.errors.password?.message}>
              {({ id, describedBy, invalid }) => (
                <div className="flex items-center gap-2">
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="tap flex size-9 shrink-0 items-center justify-center rounded-full text-label-2"
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </FieldRow>
            <ListRow
              title="Ingat saya"
              subtitle="Tetap masuk selama 30 hari"
              trailing={
                <Controller
                  control={control}
                  name="rememberMe"
                  render={({ field }) => (
                    <Switch checked={Boolean(field.value)} onChange={field.onChange} label="Ingat saya" />
                  )}
                />
              }
            />
          </ListSection>
          <Button type="submit" fullWidth loading={formState.isSubmitting}>
            Masuk
          </Button>
        </form>
      </div>
      <Toaster />
    </main>
  );
}
