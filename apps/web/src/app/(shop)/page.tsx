import { HomeView } from '@/components/shop/home-view';
import { LoadError } from '@/components/shop/load-error';
import { fetchHome, fetchStore } from '@/lib/server-api';

export default async function HomePage() {
  const [store, home] = await Promise.all([fetchStore(), fetchHome()]);
  if (!store || !home) return <LoadError />;
  return <HomeView store={store} home={home} />;
}
