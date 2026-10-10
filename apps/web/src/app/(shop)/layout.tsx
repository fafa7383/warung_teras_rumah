import type { ReactNode } from 'react';
import { FlyToCartLayer } from '@/components/motion/fly-to-cart';
import { CartPanel } from '@/components/shop/cart-panel';
import { HomeSplash } from '@/components/shop/home-splash';
import { CartMiniBar, TabBar, TopNav } from '@/components/shop/navigation';
import { Toaster } from '@/components/ui/toaster';

/** Layout pembeli: tab bar (HP), top nav (desktop), panel keranjang (≥ 1280 px), dan slot modal Detail Menu. */
export default function ShopLayout({ children, modal }: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      <TopNav />
      <div className="mx-auto flex max-w-content xl:gap-6 xl:pr-6">
        <main className="@container min-w-0 flex-1 pb-[calc(max(12px,env(safe-area-inset-bottom))+168px)] lg:pb-24">
          {children}
        </main>
        <div className="hidden pt-8 xl:block">
          <CartPanel />
        </div>
      </div>
      <CartMiniBar />
      <TabBar />
      <Toaster className="bottom-[calc(max(12px,env(safe-area-inset-bottom))+148px)] lg:bottom-24" />
      {modal}
      <FlyToCartLayer />
      <HomeSplash />
    </>
  );
}
