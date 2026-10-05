import type { Metadata } from 'next';
import { LoginView } from '@/components/admin/login-view';

export const metadata: Metadata = { title: 'Masuk' };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginView next={next} />;
}
