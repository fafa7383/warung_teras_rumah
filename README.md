# Warung Teras Rumah

Website pemesanan online mobile-first (PWA) untuk Warung Teras Rumah: pembeli memesan tanpa login
(dine-in/delivery, cash/QRIS), pemilik mengelola pesanan & menu lewat dashboard admin di HP.
Spesifikasi lengkap ada di [PRD](./PRD%20—%20Website%20Pemesanan%20Warung%20Teras%20Rumah.md).

## Struktur monorepo (pnpm workspace)

| Folder            | Isi                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `apps/web`        | Next.js 16 (App Router) + Tailwind CSS 4: halaman pembeli dan `/admin`                    |
| `apps/api`        | Express 5 + Prisma 7: REST API, SSE, cron, Web Push. Skema & seed di `apps/api/prisma`     |
| `packages/shared` | Dipakai web & api: enum status, alur status, hitung harga, format Rp/WIB/WA, skema Zod    |

## Prasyarat

- Node.js 24 LTS dan pnpm 12 (`npm install -g pnpm@12`)
- Akun Supabase (database + storage, paket gratis), Cloudflare (Turnstile), Vercel, Railway, dan domain

> **Khusus Windows di laptop ini:** file `C:\Windows\System32\cmd.exe` hilang, padahal npm/pnpm
> memakainya untuk menjalankan script. Perbaiki dulu dengan membuka **PowerShell sebagai Administrator**
> lalu jalankan `sfc /scannow` (bila belum pulih: `DISM /Online /Cleanup-Image /RestoreHealth`, lalu
> `sfc /scannow` lagi) dan restart.

## Setup lokal

1. **Install dependency**

   ```bash
   pnpm install
   ```

2. **Buat project Supabase** (region Singapore). Catat:
   - Tombol **Connect** → _Session pooler_ (port 5432) → untuk `DATABASE_URL` dan `DIRECT_URL`
   - **Project Settings → API Keys** → Project URL (`SUPABASE_URL`) dan service role / secret key

3. **Isi environment variable**

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

   Isi `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`
   (perintah pembuatnya ada di `.env.example`), dan `ADMIN_SEED_PASSWORD`.
   Kunci Turnstile di `.env.example` adalah kunci tes resmi Cloudflare, sudah bisa dipakai di lokal.

4. **Buat kunci Web Push**, salin hasilnya ke `apps/api/.env`

   ```bash
   pnpm vapid:generate
   ```

5. **Database: migrasi + seed** (akun pemilik, profil warung, jam buka, 5 kategori, 35 menu, 3 banner)

   ```bash
   pnpm db:migrate --name init
   pnpm db:seed
   ```

6. **Storage: buat bucket** publik (foto menu, banner, QRIS) dan privat (bukti bayar)

   ```bash
   pnpm storage:setup
   ```

7. **Jalankan**

   ```bash
   pnpm dev
   ```

   - Web: http://localhost:3000 (halaman cek setup: token desain + status API)
   - API: http://localhost:4000/health → `{"status":"ok","database":"ok"}`

## Perintah lain

| Perintah          | Fungsi                                                     |
| ----------------- | ---------------------------------------------------------- |
| `pnpm test`       | Unit test `packages/shared` (harga, alur status, format)    |
| `pnpm typecheck`  | Cek tipe semua paket                                       |
| `pnpm lint`       | ESLint web                                                 |
| `pnpm format`     | Prettier (urutan class Tailwind ikut dirapikan)            |
| `pnpm db:studio`  | Lihat/ubah isi database lewat Prisma Studio                |
| `pnpm build`      | Build web + api                                            |

## Deploy (akhir Hari 1)

**Domain** (PRD 10.3): `warungterasrumah.com` → Vercel, `api.warungterasrumah.com` → Railway. Satu domain
induk wajib agar cookie admin (`Domain=.warungterasrumah.com; SameSite=Lax; Secure; HttpOnly`) bekerja.

**Railway (API)** — hubungkan repo GitHub, root = folder repo:

- Build: `pnpm install --frozen-lockfile && pnpm --filter @wtr/api build`
- Start: `pnpm --filter @wtr/api db:deploy && pnpm --filter @wtr/api start`
- Health check: `/health`
- Variabel: semua isi `apps/api/.env.example`, dengan `NODE_ENV=production`,
  `WEB_ORIGIN=https://warungterasrumah.com`, `COOKIE_DOMAIN=.warungterasrumah.com`, dan kunci Turnstile asli

**Vercel (web)** — import repo yang sama, _Root Directory_ = `apps/web`, framework Next.js.
Variabel: `NEXT_PUBLIC_API_URL=https://api.warungterasrumah.com` dan `NEXT_PUBLIC_TURNSTILE_SITE_KEY` asli.

**Cloudflare Turnstile** — buat widget mode _Managed_ untuk hostname `warungterasrumah.com`
(+ `localhost` bila ingin menguji kunci asli di lokal).

## Catatan keputusan teknis

Penyesuaian kecil terhadap PRD 10.1 berdasarkan versi paket terbaru (Oktober 2026):

- **Prisma 7**: URL database untuk CLI ada di `apps/api/prisma.config.ts` (memakai `DIRECT_URL`), runtime memakai
  `DATABASE_URL` lewat `@prisma/adapter-pg`. Client di-generate ke `apps/api/src/generated` (tidak di-commit).
  Seed tidak lagi otomatis setelah migrate, jadi jalankan `pnpm db:seed`.
- **bcryptjs** (bukan `bcrypt`): algoritma & cost 12 sama, tanpa kompilasi native (lebih aman di Windows/Railway).
- **`motion`** adalah nama baru paket Framer Motion (`import { motion } from 'motion/react'`).
- **TypeScript 6.0**: TypeScript 7 belum didukung typescript-eslint.
- **Serwist (PWA)** dipasang di Hari 6, karena integrasinya dengan Turbopack (default Next 16) perlu diuji tersendiri.
- **`admin_users.token_version`** ditambahkan agar ganti password otomatis mengeluarkan sesi lama.
- **Token warna**: nama PRD `bg`, `border`, `text-*` menjadi utilitas `cream`, `line`, `ink*` agar tidak bentrok
  dengan nama utilitas Tailwind (pemetaan lengkap di `apps/web/src/app/globals.css`).

## Rencana kerja

- [x] Hari 1 — monorepo, skema Prisma + seed, token desain Tailwind, kerangka API & web
- [ ] Hari 1 — buat project Supabase, migrasi, deploy kerangka ke Vercel & Railway dengan domain
- [ ] Hari 2 — API store/home/menu, Splash, Home, All Menu, Detail Menu, keranjang Zustand
- [ ] Hari 3 — Keranjang & Checkout, POST /orders, Turnstile, rate limit, Status Pesanan, alur cash
- [ ] Hari 4 — QRIS & upload bukti, cron kedaluwarsa, Struk PNG, Riwayat
- [ ] Hari 5 — Admin: login, daftar & detail pesanan, konfirmasi/tolak/maju status, SSE, bunyi
- [ ] Hari 6 — Admin menu & pengaturan, Web Push, manifest & service worker
- [ ] Hari 7 — Splash final, uji end-to-end Android & iPhone, rilis
