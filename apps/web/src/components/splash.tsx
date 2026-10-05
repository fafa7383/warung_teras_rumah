'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BowlFilling, BowlRim, Spoon, Steam, type BowlVariant } from '@/components/brand/food-art';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { usePrefersReducedMotion } from '@/lib/hooks';

// PRD Bagian 5: mangkok dilihat dari atas berputar 360°, isinya berganti tiap putaran.
const SEQUENCE: { variant: BowlVariant; label: string }[] = [
  { variant: 'bakso', label: 'Bakso' },
  { variant: 'mie-ayam', label: 'Mie Ayam' },
  { variant: 'seblak', label: 'Seblak' },
  { variant: 'jajanan', label: 'Jajanan' },
];

const SPIN_MS = 900;
const PAUSE_MS = 150;
const CYCLE_MS = SPIN_MS + PAUSE_MS;
/** Isi berganti di titik 180°: keluar 90 ms sebelum, masuk 90 ms sesudah (ease-in-out simetris). */
const SWAP_AT_MS = SPIN_MS / 2 - 90;
const REDUCED_CYCLE_MS = 1000;
const MIN_CYCLES = 2;
const SLOW_AFTER_MS = 8000;
const FAIL_AFTER_MS = 20000;
const SPLASH_EASE = [0.65, 0, 0.35, 1] as const;

const noopSubscribe = () => () => {};
const readSplashState = () => document.documentElement.dataset.splash ?? 'running';

export function Splash() {
  const initialState = useSyncExternalStore(noopSubscribe, readSplashState, () => 'running');
  const reduceMotion = usePrefersReducedMotion();
  const bowlRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'running' | 'exiting' | 'done'>('running');
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);

  const skip = initialState === 'done';

  useEffect(() => {
    if (skip) return;
    try {
      sessionStorage.setItem('wtr-splash', '1');
    } catch {
      // mode privat: splash tetap tampil tiap kali, tidak masalah
    }

    let ready = document.readyState === 'complete';
    const onLoad = () => {
      ready = true;
    };
    window.addEventListener('load', onLoad, { once: true });

    const spin = reduceMotion
      ? null
      : bowlRef.current?.animate(
          [
            { transform: 'rotate(0deg)', easing: 'cubic-bezier(0.65, 0, 0.35, 1)', offset: 0 },
            { transform: 'rotate(360deg)', offset: SPIN_MS / CYCLE_MS },
            { transform: 'rotate(360deg)', offset: 1 },
          ],
          { duration: CYCLE_MS, iterations: Infinity },
        );

    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycleMs = reduceMotion ? REDUCED_CYCLE_MS : CYCLE_MS;
    let cycles = 0;
    let stopped = false;

    const runCycle = () => {
      if (!reduceMotion) timers.push(setTimeout(() => setIndex((i) => (i + 1) % SEQUENCE.length), SWAP_AT_MS));
      timers.push(
        setTimeout(() => {
          if (stopped) return;
          cycles++;
          // Minimal 2 putaran; splash hanya ditutup di akhir putaran saat mangkok diam.
          if (cycles >= MIN_CYCLES && ready) {
            stopped = true;
            spin?.cancel();
            document.documentElement.dataset.splash = 'leaving';
            setPhase('exiting');
            return;
          }
          if (reduceMotion) setIndex((i) => (i + 1) % SEQUENCE.length);
          runCycle();
        }, cycleMs),
      );
    };
    runCycle();
    timers.push(setTimeout(() => setSlow(true), SLOW_AFTER_MS));
    timers.push(setTimeout(() => setFailed(true), FAIL_AFTER_MS));

    return () => {
      stopped = true;
      spin?.cancel();
      timers.forEach(clearTimeout);
      window.removeEventListener('load', onLoad);
    };
  }, [skip, reduceMotion]);

  if (skip || phase === 'done') return null;

  const current = SEQUENCE[index] ?? SEQUENCE[0]!;
  const exiting = phase === 'exiting';
  const fillTransition = { duration: reduceMotion ? 0.3 : 0.09, ease: SPLASH_EASE };

  return (
    <motion.div
      className="splash-screen fixed inset-0 z-[100] overflow-hidden bg-white"
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.3, ease: SPLASH_EASE }}
      onAnimationComplete={() => {
        if (!exiting) return;
        document.documentElement.dataset.splash = 'done';
        setPhase('done');
      }}
      role="status"
      aria-label="Memuat Warung Teras Rumah"
    >
      <div className="absolute -top-28 -left-24 size-80 rounded-full bg-[#FFD9C4] opacity-60 blur-3xl" />
      <div className="absolute -right-28 bottom-16 size-96 rounded-full bg-tint-soft opacity-80 blur-3xl" />

      <div className="absolute inset-x-0 top-[42%] flex -translate-y-1/2 flex-col items-center">
        <Steam className="mb-1 h-8 w-12" />
        <motion.div animate={{ scale: exiting ? 0.9 : 1 }} transition={{ duration: 0.3, ease: SPLASH_EASE }}>
          <div ref={bowlRef} className="size-[140px] lg:size-[180px]">
            <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
              <BowlRim />
              <AnimatePresence mode={reduceMotion ? 'sync' : 'wait'} initial={false}>
                <motion.g
                  key={current.variant}
                  initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: reduceMotion ? 1 : 0.85 }}
                  transition={fillTransition}
                >
                  <BowlFilling variant={current.variant} />
                </motion.g>
              </AnimatePresence>
              <Spoon />
            </svg>
          </div>
        </motion.div>

        <div className="relative mt-7 h-6 w-48 overflow-hidden text-center">
          <AnimatePresence initial={false}>
            <motion.p
              key={current.label}
              className="absolute inset-x-0 font-rounded text-headline text-tint-pressed"
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.2, ease: SPLASH_EASE }}
            >
              {current.label}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="mt-1.5 text-subhead text-label-2">
          {slow ? 'Koneksinya agak lambat, sebentar ya…' : 'Lagi nyiapin menu, Kak…'}
        </p>
        {failed && (
          <Button size="md" variant="tinted" className="mt-5" onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+48px)] flex justify-center">
        <Logo compact size={28} />
      </div>
    </motion.div>
  );
}
