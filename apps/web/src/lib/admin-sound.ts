'use client';

// Bunyi notifikasi pesanan baru: lonceng hangat 3 kali, disintesis dengan Web Audio
// (tanpa file audio). Browser mewajibkan interaksi pengguna sebelum suara bisa diputar,
// jadi dashboard menampilkan tombol "Aktifkan Suara" sampai ditekan (PRD 8.2).

const PREFERENCE_KEY = 'wtr-admin-sound';
let context: AudioContext | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** true bila suara siap diputar di sesi halaman ini. */
export function isSoundReady(): boolean {
  return context?.state === 'running';
}

export function isSoundPreferred(): boolean {
  try {
    return localStorage.getItem(PREFERENCE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundPreferred(on: boolean) {
  try {
    localStorage.setItem(PREFERENCE_KEY, on ? 'on' : 'off');
  } catch {
    // diabaikan
  }
  emit();
}

/** Harus dipanggil dari handler klik/tap. */
export async function enableSound(): Promise<boolean> {
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    context ??= new AudioContextClass();
    if (context.state !== 'running') await context.resume();
    setSoundPreferred(true);
    emit();
    return context.state === 'running';
  } catch {
    return false;
  }
}

function bell(ctx: AudioContext, start: number) {
  // Nada dasar + harmonik dengan peluruhan eksponensial agar terdengar seperti lonceng kecil.
  const partials: [number, number][] = [
    [880, 0.5],
    [1320, 0.25],
    [1760, 0.12],
  ];
  for (const [frequency, gainValue] of partials) {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 1.2);
  }
}

export function playChime(times = 3) {
  if (!context || context.state !== 'running' || !isSoundPreferred()) return;
  const start = context.currentTime + 0.02;
  for (let i = 0; i < times; i++) bell(context, start + i * 0.42);
}
