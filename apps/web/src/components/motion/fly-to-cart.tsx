'use client';

import { motion } from 'motion/react';
import { useCallback } from 'react';
import { create } from 'zustand';
import { FoodArt } from '@/components/brand/food-art';
import { vibrate } from '@/lib/device';
import { useUiStore } from '@/lib/ui-store';

// Animasi "menu terbang ke keranjang": gambar menu melengkung dari tombol + ke ikon keranjang,
// lalu ikon keranjang memantul saat gambar tiba.

interface Point {
  x: number;
  y: number;
}

interface Flight {
  id: number;
  from: Point;
  to: Point;
  imageUrl: string | null;
  categorySlug: string;
}

interface FlightState {
  flights: Flight[];
  add: (flight: Flight) => void;
  remove: (id: number) => void;
}

const useFlightStore = create<FlightState>()((set) => ({
  flights: [],
  add: (flight) => set((state) => ({ flights: [...state.flights, flight] })),
  remove: (id) => set((state) => ({ flights: state.flights.filter((f) => f.id !== id) })),
}));

/** Ikon keranjang yang bisa jadi tujuan; posisi terakhir yang terlihat disimpan untuk tab bar yang sedang tersembunyi. */
const targets = new Map<HTMLElement, DOMRect | null>();

const center = (rect: DOMRect): Point => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

function measureVisible(element: HTMLElement): DOMRect | null {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  if (rect.bottom > window.innerHeight + 2 || rect.top < -2) return null;
  return rect;
}

function resolveTarget(): Point | null {
  for (const [element, cached] of targets) {
    // display:none di elemen atau induknya (mis. tab bar di desktop): lewati.
    if (!element.isConnected || element.getClientRects().length === 0) continue;
    const live = measureVisible(element);
    if (live) {
      targets.set(element, live);
      return center(live);
    }
    if (cached) return center(cached);
  }
  return null;
}

/** Pasang di ikon keranjang (tab bar / top nav): ref={useCartTarget()}. */
export function useCartTarget() {
  return useCallback((element: HTMLElement | null) => {
    if (!element) return;
    targets.set(element, null);
    const frame = requestAnimationFrame(() => targets.set(element, measureVisible(element)));
    // React 19: fungsi yang dikembalikan ref dipanggil saat elemen dilepas.
    return () => {
      cancelAnimationFrame(frame);
      targets.delete(element);
    };
  }, []);
}

let nextFlightId = 1;

/**
 * Luncurkan gambar menu dari `source` ke ikon keranjang. Bila tidak ada tujuan yang terlihat,
 * cukup pantulkan ikon keranjang.
 */
export function flyToCart(source: Element | DOMRect, item: { imageUrl: string | null; categorySlug: string }) {
  const to = resolveTarget();
  if (!to) {
    useUiStore.getState().bumpCart();
    return;
  }
  const rect = source instanceof Element ? source.getBoundingClientRect() : source;
  useFlightStore.getState().add({
    id: nextFlightId++,
    from: center(rect),
    to,
    imageUrl: item.imageUrl,
    categorySlug: item.categorySlug,
  });
}

const FLIGHT_SECONDS = 0.78;

function FlightDot({ flight }: { flight: Flight }) {
  const remove = useFlightStore((state) => state.remove);
  const dx = flight.to.x - flight.from.x;
  const dy = flight.to.y - flight.from.y;
  // Titik puncak lengkungan di atas kedua titik, seperti benda dilempar.
  const lift = Math.min(170, 70 + Math.abs(dx) * 0.35);
  const peakY = Math.min(0, dy) - lift;
  const times = [0, 0.42, 1];

  return (
    <motion.div
      className="absolute -mt-7 -ml-7 size-14 overflow-hidden rounded-full bg-white shadow-float ring-[3px] ring-white"
      style={{ left: flight.from.x, top: flight.from.y }}
      initial={{ x: 0, y: 0, scale: 0.4, opacity: 0, rotate: 0 }}
      animate={{
        x: [0, dx * 0.42, dx],
        y: [0, peakY, dy],
        scale: [0.4, 1.05, 0.32],
        opacity: [0, 1, 0.9],
        rotate: [0, -12, 8],
      }}
      transition={{
        duration: FLIGHT_SECONDS,
        x: { duration: FLIGHT_SECONDS, times, ease: 'linear' },
        y: { duration: FLIGHT_SECONDS, times, ease: ['easeOut', 'easeIn'] },
        scale: { duration: FLIGHT_SECONDS, times, ease: ['easeOut', 'easeIn'] },
        opacity: { duration: FLIGHT_SECONDS, times: [0, 0.15, 1] },
        rotate: { duration: FLIGHT_SECONDS, times },
      }}
      onAnimationComplete={() => {
        remove(flight.id);
        useUiStore.getState().bumpCart();
        vibrate(10);
      }}
    >
      {flight.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flight.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center bg-[#FFF5EC]">
          <FoodArt kind={flight.categorySlug} size={44} />
        </span>
      )}
    </motion.div>
  );
}

/** Lapisan tempat gambar terbang; dipasang sekali di layout pembeli. */
export function FlyToCartLayer() {
  const flights = useFlightStore((state) => state.flights);
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true">
      {flights.map((flight) => (
        <FlightDot key={flight.id} flight={flight} />
      ))}
    </div>
  );
}
