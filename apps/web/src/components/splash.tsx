'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';

// Intro pertama kali membuka web (sekali per sesi, PRD 5.4): ikon aplikasi "dirakit" dengan
// pegas, nama warung muncul huruf demi huruf, lalu semuanya terangkat dan memudar ke Home.

const MIN_VISIBLE_MS = 2200;
const SLOW_AFTER_MS = 8000;
const FAIL_AFTER_MS = 20000;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const WORDMARK = 'Warung Teras Rumah';
const DISHES = ['Bakso', 'Mie Ayam', 'Seblak', 'Jajanan', 'Es Teh'];
const LETTER_START = 0.9;
const LETTER_GAP = 0.024;

const noopSubscribe = () => () => {};
const readSplashState = () => document.documentElement.dataset.splash ?? 'running';

/** Cahaya hangat yang bergerak pelan di latar (gradien radial, tanpa filter blur agar ringan di HP). */
function SplashBackground() {
  const blobs = [
    {
      color: 'rgba(225,75,75,0.30)',
      className: '-top-[25vmax] -left-[20vmax]',
      x: [0, 60, -20],
      y: [0, 40, 10],
      duration: 7,
    },
    {
      color: 'rgba(255,190,150,0.45)',
      className: '-right-[25vmax] top-[10vh]',
      x: [0, -50, 20],
      y: [0, 60, -30],
      duration: 8,
    },
    {
      color: 'rgba(246,185,74,0.28)',
      className: '-bottom-[30vmax] left-[5vw]',
      x: [0, 40, -40],
      y: [0, -50, 0],
      duration: 9,
    },
  ];
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      aria-hidden="true"
    >
      {blobs.map((blob) => (
        <motion.div
          key={blob.color}
          className={`absolute size-[70vmax] rounded-full ${blob.className}`}
          style={{
            background: `radial-gradient(circle at center, ${blob.color} 0%, transparent 62%)`,
          }}
          animate={{ x: blob.x, y: blob.y }}
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

/** Ikon aplikasi yang dirakit: kotak masuk berputar, atap tergambar, mangkok mendarat, uap mengepul. */
function AppIcon() {
  const dashes = [18, 24.5, 31, 37.5, 44];
  // Tanpa animasi skala, riak hanya jadi cincin diam; lebih rapi tidak dimunculkan.
  // Elemennya tetap dirender agar HTML server dan klien sama saat hidrasi.
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative">
      {/* Pendar merah di belakang ikon. */}
      <motion.div
        className="absolute inset-2 rounded-[32px] bg-[#E14B4B] blur-2xl"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.45, scale: 1.15 }}
        transition={{ delay: 0.3, duration: 1.4, ease: EASE_OUT }}
        aria-hidden="true"
      />
      {/* Riak saat ikon "mendarat". */}
      {[0, 0.16].map((offset) => (
        <motion.span
          key={offset}
          className="absolute inset-0 rounded-[34px] border-2 border-[#E14B4B]"
          initial={{ opacity: 0, scale: 1 }}
          animate={
            reduceMotion ? { opacity: 0 } : { opacity: [0, 0.45, 0], scale: [0.95, 1.5, 1.75] }
          }
          transition={{ delay: 0.5 + offset, duration: 1.2, ease: 'easeOut' }}
          aria-hidden="true"
        />
      ))}

      <motion.div
        className="relative size-28 overflow-hidden rounded-[32px] shadow-[0_28px_56px_-14px_rgba(214,60,60,0.6)]"
        style={{ background: 'linear-gradient(155deg, #F47070 0%, #E14B4B 48%, #C73535 100%)' }}
        initial={{ scale: 0.3, rotate: -20, opacity: 0, filter: 'blur(12px)' }}
        animate={{ scale: 1, rotate: 0, opacity: 1, filter: 'blur(0px)' }}
        transition={{
          type: 'spring',
          stiffness: 240,
          damping: 17,
          delay: 0.1,
          opacity: { duration: 0.35, delay: 0.1 },
          filter: { duration: 0.6, delay: 0.1 },
        }}
      >
        {/* Kilap kaca di bagian atas. */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent"
          aria-hidden="true"
        />

        <svg viewBox="0 0 64 64" className="relative size-full" aria-hidden="true">
          {/* Uap tipis di atas atap, mengepul berulang. */}
          {[27, 32, 37].map((x, index) => (
            <motion.path
              key={x}
              d={`M${x} 13.5c-1.6-1.6 1.6-2.6 0-4.2s1.6-2.6 0-4.2`}
              fill="none"
              stroke="#fff"
              strokeWidth="1.6"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 0.85, 0], y: [2, 0, -3] }}
              transition={{
                delay: 1.15 + index * 0.18,
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 0.3,
                ease: 'easeOut',
              }}
            />
          ))}
          {/* Atap rumah tergambar. */}
          <motion.path
            d="M19 27 32 16.5 45 27"
            fill="none"
            stroke="#fff"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
          />
          {/* Mangkok jatuh lalu memantul. */}
          <motion.path
            d="M13 32h38a19 19 0 0 1-38 0Z"
            fill="#fff"
            initial={{ y: -16, opacity: 0, scale: 0.75 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 13, delay: 0.72 }}
          />
          {/* Motif garis di bibir mangkok, muncul satu per satu. */}
          {dashes.map((x, index) => (
            <motion.line
              key={x}
              x1={x}
              x2={x + 3}
              y1="36.5"
              y2="36.5"
              stroke="#E14B4B"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 20,
                delay: 0.98 + index * 0.05,
              }}
            />
          ))}
        </svg>

        {/* Kilau yang menyapu ikon sekali. */}
        <motion.div
          className="absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/50 to-transparent"
          initial={{ x: '-60%' }}
          animate={{ x: '420%' }}
          transition={{ delay: 1.2, duration: 0.95, ease: 'easeInOut' }}
          aria-hidden="true"
        />
      </motion.div>
    </div>
  );
}

/** Nama warung muncul huruf demi huruf, dari buram menjadi tajam. */
function Wordmark() {
  let letterIndex = 0;
  return (
    <h1
      className="mt-8 font-rounded text-[30px] leading-[36px] font-semibold tracking-tight text-label"
      aria-label={WORDMARK}
    >
      {WORDMARK.split(' ').map((word, wordIndex, words) => (
        <span key={word} className="inline-block whitespace-nowrap" aria-hidden="true">
          {[...word].map((letter) => {
            const index = letterIndex++;
            return (
              <motion.span
                key={index}
                className="inline-block"
                initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  delay: LETTER_START + index * LETTER_GAP,
                  duration: 0.65,
                  ease: EASE_OUT,
                }}
              >
                {letter}
              </motion.span>
            );
          })}
          {wordIndex < words.length - 1 && ' '}
        </span>
      ))}
    </h1>
  );
}

/** "Lagi nyiapin Bakso…" dengan nama menu yang bergulir. */
function Tagline({ slow }: { slow: boolean }) {
  const [dish, setDish] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setDish((i) => (i + 1) % DISHES.length), 700);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      className="mt-3 h-6 text-subhead text-label-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: LETTER_START + WORDMARK.length * LETTER_GAP + 0.1,
        duration: 0.6,
        ease: EASE_OUT,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {slow ? (
          <motion.p
            key="slow"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Koneksinya agak lambat, sebentar ya…
          </motion.p>
        ) : (
          <motion.p
            key="ready"
            className="flex items-center justify-center gap-1"
            exit={{ opacity: 0 }}
          >
            Lagi nyiapin
            <span className="relative inline-flex h-6 min-w-[5.2em] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={DISHES[dish]}
                  className="font-semibold text-tint"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                >
                  {DISHES[dish]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function Splash() {
  const initialState = useSyncExternalStore(noopSubscribe, readSplashState, () => 'running');
  const skip = initialState === 'done';
  const [phase, setPhase] = useState<'intro' | 'exiting' | 'done'>('intro');
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (skip) return;
    try {
      sessionStorage.setItem('wtr-splash', '1');
    } catch {
      // mode privat: intro tetap tampil tiap kali, tidak masalah
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    const started = performance.now();
    const leave = () => {
      if (cancelled) return;
      // Home mulai naik berurutan bersamaan dengan intro memudar.
      document.documentElement.dataset.splash = 'leaving';
      setPhase('exiting');
    };
    const afterMinimum = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started));
      timers.push(setTimeout(leave, wait));
    };

    // Tutup setelah minimal 2,2 detik dan halaman (gambar dll.) selesai dimuat.
    if (document.readyState === 'complete') afterMinimum();
    else window.addEventListener('load', afterMinimum, { once: true });
    timers.push(setTimeout(() => setSlow(true), SLOW_AFTER_MS));
    timers.push(setTimeout(() => setFailed(true), FAIL_AFTER_MS));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('load', afterMinimum);
    };
  }, [skip]);

  if (skip || phase === 'done') return null;
  const exiting = phase === 'exiting';

  return (
    <motion.div
      className="splash-screen fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#FFF8F4]"
      initial={false}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.5, ease: 'easeInOut', delay: exiting ? 0.18 : 0 }}
      onAnimationComplete={() => {
        if (!exiting) return;
        document.documentElement.dataset.splash = 'done';
        setPhase('done');
      }}
      role="status"
      aria-label="Memuat Warung Teras Rumah"
    >
      <SplashBackground />

      <motion.div
        className="relative flex -translate-y-[4vh] flex-col items-center px-8 text-center"
        initial={false}
        animate={
          exiting
            ? { y: -24, scale: 0.94, opacity: 0, filter: 'blur(10px)' }
            : { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.55, ease: EASE_OUT }}
      >
        <AppIcon />
        <Wordmark />
        <Tagline slow={slow} />
        {failed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Button size="md" variant="tinted" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Garis tipis di bawah: tanda masih memuat, muncul belakangan. */}
      <motion.div
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+44px)] h-1 w-14 overflow-hidden rounded-full bg-black/[0.06]"
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ delay: exiting ? 0 : 1.6, duration: 0.4 }}
        aria-hidden="true"
      >
        <motion.div
          className="h-full w-1/2 rounded-full bg-[#E14B4B]"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
