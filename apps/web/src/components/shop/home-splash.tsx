'use client';

import { animate, motion, useAnimationControls, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { usePrefersReducedMotion } from '@/lib/hooks';

// Splash Home (PRD 5) ala "jendela": lapisan polos menutup layar, kecuali satu jendela bersudut
// bulat yang memperlihatkan header Home di baliknya (langit sesuai jam + pemandangan warung).
// Saat halaman siap, jendela melebar memenuhi layar, logo meluncur ke posisinya di header, dan
// wadah konten naik menutupi warung. Jadi splash bukan layar terpisah: yang terlihat memang
// Home itu sendiri, sehingga peralihannya menyambung tanpa potongan.
//
// Status di html[data-splash] (running → leaving → done) menggerakkan bagian Home lewat CSS
// (globals.css); komponen ini mengatur jendela, logo, garis loading, dan waktunya.
// Tampil setiap kali Home dibuka atau di-refresh (bukan saat pindah halaman di dalam app).

const MIN_VISIBLE_MS = 2000;
const SLOW_AFTER_MS = 8000;
const FAIL_AFTER_MS = 20000;
/** Sejak jendela mulai melebar: kapan Home mulai naik, dan kapan splash dilepas. */
const LEAVING_AFTER_MS = 50;
const DONE_AFTER_MS = 1800;
/** Durasi peralihan ke Home; kurvanya ease-in-out (= --ease-splash di globals.css). */
const REVEAL_S = 1.6;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
const DESKTOP_MIN_WIDTH = 1024;
const WINDOW_RADIUS = 28;
/** Isi jendela muncul perlahan (fade-in) setelah halaman siap tampil. */
const WINDOW_FADE_IN_S = 0.9;
/** Tebal tanah yang terlihat di dasar jendela. */
const GROUND_INSET = 34;
// Bayangan teks logo di header (text-shadow-sky), versi transparan sebagai titik awal.
const BRAND_SHADOW_ON = '0px 1px 2px rgba(0,0,0,0.2), 0px 2px 18px rgba(0,0,0,0.25)';
const BRAND_SHADOW_OFF = '0px 1px 2px rgba(0,0,0,0), 0px 2px 18px rgba(0,0,0,0)';

const noopSubscribe = () => () => {};
const readSplashState = () => document.documentElement.dataset.splash ?? 'running';

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SplashLayout {
  window: Box;
  viewport: Box;
  /** Posisi atas logo & garis loading (px dari atas layar). */
  labelTop: number;
  /** Garis tanah pemandangan warung (px dari atas header): sedikit di atas tepi bawah jendela,
   *  jadi tanahnya terlihat sebagai pijakan dan warung tampil utuh. */
  ground: number;
}

/** Di HP jendela ada di tengah layar; di desktop di tengah kartu header. */
function computeLayout(hero: DOMRect): SplashLayout {
  // Ukuran lapisan fixed (viewport tata letak), bukan innerWidth/innerHeight (viewport visual).
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  const viewport = { top: 0, left: 0, width: vw, height: vh };

  if (vw >= DESKTOP_MIN_WIDTH) {
    const width = Math.min(hero.width * 0.5, 460);
    const top = hero.top + 36;
    const bottom = hero.bottom - 20;
    return {
      window: { top, left: hero.left + (hero.width - width) / 2, width, height: bottom - top },
      viewport,
      labelTop: bottom + 28,
      ground: bottom - GROUND_INSET - hero.top,
    };
  }

  const width = Math.min(vw - 56, 340);
  const labelTop = Math.round(vh * 0.68);
  const bottom = labelTop - 28;
  const top = Math.max(Math.round(vh * 0.12), bottom - width * 1.3);
  return {
    window: { top, left: (vw - width) / 2, width, height: bottom - top },
    viewport,
    labelTop,
    ground: bottom - GROUND_INSET - hero.top,
  };
}

/**
 * clip-path "seluruh lapisan dikurangi kotak bersudut bulat" (aturan evenodd = berlubang).
 * Kotak luarnya sengaja jauh lebih besar dari layar agar tidak bergantung ukuran viewport
 * (di HP tinggi viewport berubah saat bilah alamat muncul/hilang).
 */
function holePath(x: number, y: number, w: number, h: number, radius: number) {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const right = x + w;
  const bottom = y + h;
  return (
    `path(evenodd, "M-9999 -9999H19999V19999H-9999Z ` +
    `M${x + r} ${y}H${right - r}A${r} ${r} 0 0 1 ${right} ${y + r}V${bottom - r}` +
    `A${r} ${r} 0 0 1 ${right - r} ${bottom}H${x + r}A${r} ${r} 0 0 1 ${x} ${bottom - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z")`
  );
}

/**
 * Dirender di layout toko (bukan di dalam halaman) agar lapisannya berada di atas tab bar &
 * menu atas: pembungkus halaman memakai animasi yang membentuk stacking context sendiri.
 * Header Home dicari lewat [data-home-hero]. Di halaman selain Home splash tidak aktif
 * (layout.tsx memasang data-splash="done").
 */
export function HomeSplash() {
  const initialState = useSyncExternalStore(noopSubscribe, readSplashState, () => 'running');
  const skip = initialState === 'done';
  const reduceMotion = usePrefersReducedMotion();
  const [layout, setLayout] = useState<SplashLayout | null>(null);
  const [phase, setPhase] = useState<'loading' | 'revealing' | 'done'>('loading');
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const brandRef = useRef<HTMLDivElement>(null);
  const brand = useAnimationControls();

  // Lubang jendela pada lapisan polos (px dari kiri atas layar). Lapisannya satu elemen dengan
  // clip-path "layar dikurangi kotak bulat", jadi tidak ada celah di layar berskala pecahan.
  const holeX = useMotionValue(0);
  const holeY = useMotionValue(0);
  const holeW = useMotionValue(0);
  const holeH = useMotionValue(0);
  const holeR = useMotionValue(WINDOW_RADIUS);
  const viewportRef = useRef({ width: 0, height: 0 });
  const clipPath = useTransform([holeX, holeY, holeW, holeH, holeR], ([x, y, w, h, r]: number[]) =>
    holePath(x!, y!, w!, h!, r!),
  );

  // Ukur jendela setelah Home ter-render; garis tanah warung ikut diatur di header.
  useEffect(() => {
    if (skip) return;
    const measure = () => {
      const hero = document.querySelector<HTMLElement>('[data-home-hero]');
      if (!hero) return;
      const next = computeLayout(hero.getBoundingClientRect());
      hero.style.setProperty('--splash-ground', `${next.ground}px`);
      // Wadah konten menunggu tepat di bawah tepi layar (bukan satu layar penuh di bawah
      // posisinya), jadi langsung terlihat naik sejak awal peralihan.
      const sheet = document.querySelector<HTMLElement>('.home-sheet');
      if (sheet) {
        const shift = new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m42;
        const restTop = sheet.getBoundingClientRect().top - shift;
        const offset = Math.max(0, next.viewport.height - restTop) + 8;
        document.documentElement.style.setProperty('--splash-sheet-offset', `${offset}px`);
      }
      setLayout(next);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [skip]);

  // Lubang jendela langsung di posisi akhirnya (tengah); isinya muncul lewat fade-in penutup di
  // bawah, bukan dengan menumbuhkan kotak. Ikut menyesuaikan bila ukuran layar berubah.
  useEffect(() => {
    if (!layout || phase !== 'loading') return;
    viewportRef.current = { width: layout.viewport.width, height: layout.viewport.height };
    holeX.set(layout.window.left);
    holeY.set(layout.window.top);
    holeW.set(layout.window.width);
    holeH.set(layout.window.height);
    holeR.set(WINDOW_RADIUS);
  }, [layout, phase, holeX, holeY, holeW, holeH, holeR]);

  // Buka setelah minimal 2 detik dan halaman selesai dimuat.
  useEffect(() => {
    if (skip) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    const started = performance.now();
    const ready = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      timers.push(setTimeout(() => !cancelled && setPhase('revealing'), wait));
    };

    if (document.readyState === 'complete') ready();
    else window.addEventListener('load', ready, { once: true });
    timers.push(setTimeout(() => setSlow(true), SLOW_AFTER_MS));
    timers.push(setTimeout(() => setFailed(true), FAIL_AFTER_MS));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('load', ready);
    };
  }, [skip]);

  // Peralihan ke Home.
  useEffect(() => {
    if (phase !== 'revealing') return;
    const root = document.documentElement;
    const timers = [
      setTimeout(
        () => {
          root.dataset.splash = 'leaving';
        },
        reduceMotion ? 0 : LEAVING_AFTER_MS,
      ),
      setTimeout(
        () => {
          root.dataset.splash = 'done';
          setPhase('done');
        },
        reduceMotion ? 650 : DONE_AFTER_MS,
      ),
    ];

    // Di HP logo meluncur tepat ke logo header (ukurannya sama); di desktop logo header
    // tersembunyi (ada di menu atas), jadi cukup memudar.
    const source = brandRef.current?.getBoundingClientRect();
    const target = document.querySelector('[data-brand-target]')?.getBoundingClientRect();
    if (!reduceMotion && source && target && target.width > 0) {
      void brand.start(
        {
          x: target.left - source.left,
          y: target.top - source.top,
          color: '#ffffff',
          textShadow: BRAND_SHADOW_ON,
        },
        { duration: REVEAL_S - 0.15, ease: EASE_IN_OUT, delay: 0.1 },
      );
    } else {
      void brand.start({ opacity: 0 }, { duration: 0.3 });
    }

    // Jendela melebar memenuhi layar, sedikit melewati tepinya agar tak ada sisa garis
    // (saat animasi dikurangi, lapisannya cukup memudar).
    const { width, height } = viewportRef.current;
    const overshoot = 24;
    const expand = { duration: REVEAL_S, ease: EASE_IN_OUT };
    const controls = reduceMotion
      ? []
      : [
          animate(holeX, -overshoot, expand),
          animate(holeY, -overshoot, expand),
          animate(holeW, width + overshoot * 2, expand),
          animate(holeH, height + overshoot * 2, expand),
          animate(holeR, 0, expand),
        ];

    return () => {
      timers.forEach(clearTimeout);
      controls.forEach((control) => control.stop());
    };
  }, [phase, reduceMotion, brand, holeX, holeY, holeW, holeH, holeR]);

  if (skip || phase === 'done') return null;
  const revealing = phase === 'revealing';
  const win = layout?.window;

  return (
    <motion.div
      className="splash-screen fixed inset-0 z-[100] touch-none"
      initial={false}
      animate={{ opacity: revealing && reduceMotion ? 0 : 1 }}
      transition={{ duration: 0.6, ease: EASE_IN_OUT }}
      role="status"
      aria-label="Memuat Warung Teras Rumah"
    >
      {/* Lapisan polos. Sebelum JavaScript jalan menutup penuh; setelah itu berlubang jendela. */}
      <motion.div
        className="absolute inset-0 bg-canvas"
        style={layout ? { clipPath } : undefined}
      />
      {/* Penutup seukuran jendela yang memudar: pemandangan muncul dengan fade-in di tengah. */}
      {win && !revealing && (
        <motion.div
          className="absolute bg-canvas"
          style={{
            top: win.top,
            left: win.left,
            width: win.width,
            height: win.height,
            borderRadius: WINDOW_RADIUS,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0.3 : WINDOW_FADE_IN_S,
            ease: EASE_IN_OUT,
            delay: 0.1,
          }}
          aria-hidden="true"
        />
      )}

      <div
        className="absolute flex flex-col items-center text-center transition-[top] duration-500"
        // Rata tengah terhadap jendela (di desktop jendela ada di kolom kiri, bukan tengah layar).
        style={
          win
            ? { top: layout.labelTop, left: win.left, width: win.width }
            : { top: '68%', left: 0, right: 0 }
        }
      >
        <motion.div
          ref={brandRef}
          animate={brand}
          className="flex items-center gap-2.5"
          style={{ color: '#1d1d1f', textShadow: BRAND_SHADOW_OFF }}
        >
          <LogoMark size={36} className="shrink-0" />
          <span className="font-rounded text-headline font-semibold">Warung Teras Rumah</span>
        </motion.div>

        <motion.div
          className="mt-4 h-[3px] w-[120px] overflow-hidden rounded-full bg-black/[0.08]"
          initial={false}
          animate={{ opacity: revealing ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          aria-hidden="true"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-tint"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: revealing ? 1 : 0.9 }}
            transition={
              revealing
                ? { duration: 0.2 }
                : { duration: MIN_VISIBLE_MS / 1000, ease: [0.2, 0.7, 0.3, 1] }
            }
          />
        </motion.div>

        {failed ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <p className="text-footnote text-label-2">Halamannya belum termuat.</p>
            <Button size="md" variant="tinted" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          </div>
        ) : (
          slow && (
            <p className="mt-4 text-footnote text-label-2">Koneksinya agak lambat, sebentar ya…</p>
          )
        )}
      </div>
    </motion.div>
  );
}
