# PRD — Website Pemesanan Warung Teras Rumah

Oct 5, 2026 · @Farhan

## 1. Ringkasan Produk

Warung Teras Rumah butuh website pemesanan online mobile-first (PWA) yang memungkinkan pembeli memesan tanpa login, memilih dine-in atau delivery, dan membayar dengan cash atau QRIS. Pemilik mengelola pesanan dan menu lewat dashboard admin yang nyaman dipakai di HP.

**Konteks bisnis.** Satu warung, menjual bakso, mie ayam, seblak, jajanan ringan (basreng, otak-otak, dll.) dan minuman. Volume saat ini sekitar 1–4 pesanan per hari, jadi website ini bertujuan menambah kanal penjualan, bukan menangani lonjakan trafik.

**Tujuan produk**

- Pembeli bisa memesan dari HP dalam waktu kurang dari 2 menit, tanpa membuat akun.
- Pemilik tahu ada pesanan masuk dalam hitungan detik (bunyi di dashboard + notifikasi HP).
- Pemilik bisa memverifikasi pembayaran QRIS dan mengubah status pesanan dari HP dengan 1–2 tap.
- Tampilan terasa hangat, manis, dan ramah keluarga, sehingga warung kecil terlihat profesional.

**Target pengguna**

| Peran | Siapa | Perangkat utama | Kebutuhan inti |
| --- | --- | --- | --- |
| Pembeli | Warga sekitar, keluarga, pekerja | HP Android/iPhone, sesekali laptop | Lihat menu, pesan cepat, tahu status pesanan |
| Pemilik (admin) | Pemilik Warung Teras Rumah, 1 akun | HP | Terima notifikasi, verifikasi QRIS, update status, kelola menu |

**Termasuk dalam lingkup (MVP)**

- Splash screen animasi mangkok berputar.
- 3 tab pembeli: Home, Menu, Keranjang, plus halaman Status Pesanan, Struk, dan Riwayat.
- Varian menu: level pedas, porsi, topping.
- Dine-in dan delivery (free ongkir, tanpa minimal order).
- Pembayaran cash dan QRIS statis dengan upload bukti + verifikasi manual pemilik.
- Captcha, rate limit, riwayat pesanan tersimpan di perangkat.
- Dashboard admin mobile-first: pesanan, menu, banner, laporan sederhana, pengaturan.
- PWA (bisa dipasang ke Home Screen) dan notifikasi push untuk pemilik.

**Di luar lingkup (tidak dikerjakan)**

- Login atau akun pembeli.
- Payment gateway / QRIS dinamis dan refund otomatis (refund dilakukan manual).
- Live tracking kurir dan peta/pin lokasi.
- Ongkir, minimal order, nomor meja.
- Catatan per item.
- Multi-warung, multi-admin, peran kasir/dapur/kurir terpisah.
- Mode gelap (hanya light mode).

## 2. Keputusan Produk Utama

Semua keputusan di bawah sudah disepakati dan menjadi acuan desain serta development.

| Topik | Keputusan | Alasan |
| --- | --- | --- |
| Verifikasi QRIS | Manual oleh pemilik. Pembeli wajib upload bukti bayar, pemilik mencocokkan dengan mutasi di aplikasi bank/merchant lalu menekan Terima atau Tolak. | QRIS warung adalah QRIS statis, tidak bisa dicek otomatis tanpa payment gateway. Volume 1–4 pesanan/hari sangat mudah ditangani manual. |
| Batas waktu bayar QRIS | 10 menit sejak pesanan dibuat sampai bukti terupload. Lewat dari itu, pesanan otomatis berstatus Kedaluwarsa. | Mencegah pesanan menggantung. |
| Refund | Manual di luar sistem. Sistem hanya mencatat alasan penolakan dan menampilkan tombol WA ke pembeli. | Kebutuhan refund sangat jarang. |
| Login pembeli | Tidak ada. Riwayat disimpan di perangkat (localStorage) + link pesanan unik. | Mempercepat pemesanan. |
| Anti-spam | Cloudflare Turnstile di tombol Pesan + rate limit server. | Gratis, ringan, umumnya tanpa klik gambar. |
| Cash dine-in | Pesanan masuk berstatus Menunggu Konfirmasi; pembeli bayar di kasir. Pemilik menekan Konfirmasi. | Pembeli tahu pemilik sudah mulai bergerak. |
| Cash delivery (COD) | Wajib dikonfirmasi pemilik dulu sebelum diproses. | Mitigasi pesanan iseng dengan alamat palsu. |
| Status dine-in | Hanya 2 status utama: Menunggu Konfirmasi dan Dikonfirmasi (selesai). | Sederhana, sesuai permintaan. |
| Status delivery | Menunggu Konfirmasi, Diproses, Diantar, Selesai. Tanpa tracking. | Cukup informatif tanpa kompleksitas peta. |
| Ongkir | Gratis, tanpa minimal order. | Kebijakan warung. |
| Alamat | Ketik manual + patokan. Tanpa peta. | Tanpa biaya API peta. |
| Data pembeli | Nama dan nomor WhatsApp (dine-in & delivery), alamat + patokan (delivery saja). | Minimal tapi cukup untuk konfirmasi. |
| Nomor meja | Tidak ada. | Warung kecil, pemilik mengenali pembeli dari nama. |
| Catatan per item | Tidak ada di MVP. | Disederhanakan. |
| Stok | Toggle Tersedia / Habis per menu. | Sederhana. |
| Jam operasional | Pemesanan otomatis ditutup di luar jam buka. Pemilik juga bisa menutup manual. | Mencegah pesanan saat warung tutup. |
| Notifikasi pemilik | Bunyi + banner di dashboard, Web Push ke HP pemilik, dan WhatsApp. | Pemilik tidak selalu membuka dashboard. |
| Struk | Struk digital di halaman pesanan, bisa diunduh sebagai gambar PNG dan dibagikan. | Bukti transaksi untuk pembeli. |

**Catatan WhatsApp untuk pemilik.** WhatsApp otomatis butuh layanan pihak ketiga berbayar (WhatsApp Business API resmi atau gateway seperti Fonnte). Untuk MVP:

1. Utama: Web Push + bunyi di dashboard (gratis).
2. Cadangan tanpa biaya: setelah pesanan dibuat, pembeli melihat tombol Kirim Pesanan via WhatsApp yang membuka chat ke nomor pemilik dengan teks ringkasan pesanan yang sudah terisi.
3. Opsional fase 2: WA otomatis ke pemilik lewat gateway, diaktifkan lewat environment variable tanpa ubah kode lain.

**Catatan iPhone.** Web Push di iPhone hanya berfungsi jika dashboard dipasang ke Home Screen (PWA) dan iOS 16.4 ke atas. Onboarding admin wajib memandu langkah ini.

## 3. Design System

Gayanya light mode dengan merah hangat sebagai primary, latar krem lembut, sudut membulat, dan ilustrasi makanan yang manis, sehingga terasa seperti makan di teras rumah keluarga.

**Kata kunci visual:** hangat, manis, ramah keluarga, rumahan, bersih, membulat. Hindari kesan fast-food korporat (merah terlalu terang + hitam pekat) dan kesan dingin (abu-abu kebiruan).

### 3.1 Warna

| Token | Hex | Pemakaian |
| --- | --- | --- |
| primary-600 | #E14B4B | Tombol utama, ikon aktif bottom nav, harga, badge keranjang |
| primary-700 | #C23838 | State pressed/hover tombol utama |
| primary-100 | #FDE7E4 | Latar chip aktif, latar badge lembut, highlight |
| primary-50 | #FFF3F1 | Latar section rekomendasi |
| accent-400 | #F6B94A | Bintang "Terlaris", badge promo, aksen ilustrasi (kuning mentega) |
| peach-200 | #FFD9C4 | Ilustrasi, latar banner, aksen dekoratif |
| bg | #FFF9F4 | Latar halaman (krem hangat) |
| surface | #FFFFFF | Kartu, bottom sheet, bottom nav |
| border | #F1E3DA | Garis kartu, divider, outline input |
| text-primary | #2E2320 | Judul dan teks utama (coklat sangat tua, bukan hitam) |
| text-secondary | #7A6862 | Deskripsi, label, keterangan |
| text-disabled | #B9AAA4 | Teks nonaktif, placeholder |
| success | #2F9E6B | Status Dikonfirmasi/Selesai, toggle Tersedia |
| success-100 | #E3F5EC | Latar badge sukses |
| warning | #E8962E | Status Menunggu, timer QRIS |
| warning-100 | #FDF1DF | Latar badge menunggu |
| info | #3E7FD6 | Status Diantar |
| info-100 | #E5EFFB | Latar badge diantar |
| danger | #B3261E | Error, Ditolak, Batalkan (lebih gelap dari primary agar tidak tertukar) |
| danger-100 | #FBE4E2 | Latar badge ditolak |

Aturan kontras: teks putih hanya di atas primary-600 atau yang lebih gelap; teks di atas primary-100 memakai primary-700. Status tidak boleh dibedakan hanya dengan warna, selalu ada ikon + label.

### 3.2 Tipografi

- Judul/display: **Fredoka** (Google Fonts) weight 600, untuk nama warung, judul halaman, harga besar. Bentuknya bulat dan ramah.
- Isi/UI: **Nunito** weight 400/600/700, untuk semua teks lain.
- Fallback: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Gaya | Font | Ukuran / line-height | Pemakaian |
| --- | --- | --- | --- |
| Display | Fredoka 600 | 28 / 34 px | Nama warung di Home, total di struk |
| H1 | Fredoka 600 | 22 / 28 px | Judul halaman |
| H2 | Fredoka 600 | 18 / 24 px | Judul section |
| Body-lg | Nunito 600 | 16 / 24 px | Nama menu di kartu |
| Body | Nunito 400 | 14 / 20 px | Deskripsi, isi form |
| Caption | Nunito 600 | 12 / 16 px | Badge, label kecil, keterangan |
| Price | Nunito 800 | 16 / 20 px | Harga, warna primary-600 |

Ukuran minimal teks 12 px. Input form minimal 16 px agar iOS tidak auto-zoom.

### 3.3 Bentuk, jarak, bayangan

- Grid jarak 4 px: 4, 8, 12, 16, 20, 24, 32.
- Padding halaman mobile 16 px; desktop konten maksimal 1200 px.
- Radius: input & tombol 14 px, kartu 18 px, bottom sheet 24 px (sudut atas), chip & badge 999 px (pil).
- Bayangan kartu: `0 4px 16px rgba(194, 56, 56, 0.08)` (bayangan bernuansa merah hangat, bukan abu-abu).
- Bayangan bottom nav: `0 -4px 20px rgba(46, 35, 32, 0.06)`.
- Target sentuh minimal 44 × 44 px; tombol utama tinggi 52 px, lebar penuh di mobile.

### 3.4 Ikon, gambar, ilustrasi

- Ikon: Lucide, stroke 2 px, sudut membulat, ukuran 20/24 px.
- Foto menu: rasio 1:1 di grid, 16:9 di bottom sheet detail; object-fit cover; placeholder ilustrasi mangkok saat foto belum ada atau gagal dimuat.
- Ilustrasi: gaya flat, garis membulat, palet primary + peach + accent. Dipakai di splash, empty state, sukses pesanan, dan halaman tutup.
- Logo dummy: teks "Warung Teras Rumah" (Fredoka 600) dengan ikon mangkok + atap rumah kecil di atasnya, warna primary-600.

### 3.5 Gerak (motion)

- Durasi: 150 ms (tap, toggle), 250 ms (bottom sheet, toast), 350 ms (transisi halaman).
- Easing standar: `cubic-bezier(0.4, 0, 0.2, 1)`; easing splash: `cubic-bezier(0.65, 0, 0.35, 1)` (ease-in-out).
- Tombol "+" saat ditekan: scale 0.92 lalu kembali, ikon keranjang di bottom nav bounce kecil dan badge bertambah.
- Hormati `prefers-reduced-motion`: animasi diganti fade sederhana.

### 3.6 Komponen inti

| Komponen | Varian / state | Catatan |
| --- | --- | --- |
| Button | Primary, Secondary (outline primary), Ghost, Danger; default, pressed, disabled, loading (spinner) | Primary lebar penuh di mobile |
| Menu Card | Grid (Menu), horizontal scroll (Home); normal, Habis (foto grayscale + badge Habis, tombol + nonaktif) | Foto, nama, deskripsi 1 baris, harga "mulai Rp", tombol + |
| Quantity Stepper | - angka +; minimal 1 di detail, angka 0 di keranjang memicu hapus dengan konfirmasi | Tombol 36 px |
| Chip | Kategori, filter; aktif = primary-100 + teks primary-700 | Scroll horizontal |
| Option Group | Radio (level pedas, porsi), Checkbox (topping) dengan harga tambahan di kanan | Label wajib/opsional |
| Status Badge | Menunggu Pembayaran, Menunggu Konfirmasi, Diproses, Diantar, Selesai/Dikonfirmasi, Ditolak, Kedaluwarsa, Dibatalkan | Ikon + label + warna status |
| Bottom Sheet | Detail menu, konfirmasi | Handle bar, tarik ke bawah untuk menutup |
| Toast | Sukses, error | Muncul di atas bottom nav, 3 detik |
| Empty State | Keranjang kosong, riwayat kosong, hasil cari kosong | Ilustrasi + teks + tombol |
| Skeleton | Kartu menu, banner | Shimmer krem |

### 3.7 Gaya bahasa (copy)

Bahasa Indonesia santai, sopan, hangat, menyapa dengan "Kak". Contoh: "Mau makan apa hari ini, Kak?", "Pesananmu sudah kami terima!", "Yah, menu ini lagi habis". Hindari bahasa teknis seperti "error 500" atau "request gagal"; gunakan "Ada kendala, coba lagi ya". Harga ditulis "Rp15.000" (titik ribuan, tanpa spasi).

## 4. Arsitektur Informasi & Navigasi

Pembeli bergerak di antara 3 tab bottom nav (Home, Menu, Keranjang); halaman lain dibuka di atasnya dengan tombol kembali. Admin memakai 4 tab bottom nav sendiri di bawah path `/admin`.

### 4.1 Daftar halaman pembeli

| Route | Halaman | Navigasi | Keterangan |
| --- | --- | --- | --- |
| `/` | Splash → Home | Tab 1 | Splash hanya sekali per sesi browser |
| `/menu` | All Menu | Tab 2 | Query `?kategori=bakso` untuk filter dari Home |
| `/menu/[slug]` | Detail Menu | Bottom sheet di mobile, modal di desktop | URL bisa dibagikan |
| `/keranjang` | Keranjang + Checkout | Tab 3, badge jumlah item | Satu halaman, scroll |
| `/pesanan/[token]` | Status Pesanan | Dibuka setelah checkout | Berisi pembayaran QRIS bila perlu |
| `/pesanan/[token]/struk` | Struk | Dari Status Pesanan | Bisa diunduh PNG |
| `/riwayat` | Riwayat Pesanan | Ikon jam di header Home | Dari localStorage |
| `/cek-pesanan` | Cek Pesanan | Link di Riwayat | Pakai kode pesanan + nomor WA |
| `/offline` | Offline | Otomatis via service worker | Ilustrasi + tombol coba lagi |

### 4.2 Daftar halaman admin

| Route | Halaman | Navigasi |
| --- | --- | --- |
| `/admin/login` | Login | - |
| `/admin` | Pesanan (daftar) | Tab 1, badge jumlah perlu tindakan |
| `/admin/pesanan/[id]` | Detail Pesanan | Dari daftar |
| `/admin/menu` | Kelola Menu | Tab 2 |
| `/admin/menu/baru`, `/admin/menu/[id]` | Form Menu | Dari Kelola Menu |
| `/admin/laporan` | Laporan | Tab 3 |
| `/admin/pengaturan` | Pengaturan (toko, jam, QRIS, banner, kategori, notifikasi, akun) | Tab 4 |

### 4.3 Aturan navigasi mobile (< 768 px)

- Bottom nav tetap (fixed) setinggi 64 px + `env(safe-area-inset-bottom)`, latar putih, ikon 24 px + label 12 px.
- Ikon: Home = `house`, Menu = `utensils`, Keranjang = `shopping-bag` dengan badge angka (merah, maksimal tampil "9+").
- Tab aktif: ikon & label primary-600 + titik/pil kecil di atas ikon; tab tidak aktif: text-secondary.
- Bottom nav disembunyikan di halaman Status Pesanan, Struk, dan saat bottom sheet terbuka.
- Di Keranjang, tombol "Pesan Sekarang" menempel di atas bottom nav (sticky CTA).
- Saat item ditambah dari halaman mana pun dan keranjang tidak sedang dibuka, muncul mini-bar "2 item · Rp30.000 · Lihat Keranjang" di atas bottom nav.

### 4.4 Aturan navigasi tablet & desktop

- 768–1023 px: bottom nav tetap, grid menu 3 kolom.
- ≥ 1024 px: bottom nav diganti top nav (logo kiri; Home, Menu, Riwayat di tengah; ikon keranjang + badge di kanan). Grid menu 4 kolom.
- ≥ 1280 px: keranjang tampil sebagai panel samping kanan (lebar 380 px) yang selalu terlihat di Home dan Menu; route `/keranjang` tetap ada untuk checkout penuh.
- Detail menu tampil sebagai modal tengah (lebar 560 px), bukan bottom sheet.
- Admin desktop: bottom nav admin menjadi sidebar kiri 240 px; daftar pesanan dan detail tampil berdampingan (list-detail).

## 5. Splash Screen: Mangkok Berputar

Splash tampil saat web pertama kali dibuka dalam satu sesi: mangkok dilihat dari atas berputar 360°, dan setiap satu putaran isinya berganti menu, dengan easing ease-in-out.

### 5.1 Tata letak

- Latar: bg #FFF9F4 penuh layar dengan 2–3 lingkaran blur peach-200 dan primary-50 samar di sudut.
- Tengah layar (sedikit di atas tengah, sekitar 42% dari atas): ilustrasi mangkok dilihat dari atas, diameter 140 px (mobile) / 180 px (desktop).
- Mangkok: lingkaran putih dengan tepi tebal primary-600 dan motif garis kecil di bibir mangkok (seperti mangkok ayam jago, tapi versi garis sederhana). Sendok bebek di bibir mangkok ikut berputar sebagai penanda gerak.
- Uap: 3 garis bergelombang di atas mangkok, tidak ikut berputar, naik-turun pelan (loop 1,6 detik).
- Di bawah mangkok (jarak 28 px): nama menu yang sedang tampil, Fredoka 600 18 px, primary-700.
- Di bawahnya: teks "Lagi nyiapin menu, Kak…" Nunito 14 px text-secondary.
- Paling bawah (jarak 48 px dari bawah): logo dummy "Warung Teras Rumah".

### 5.2 Urutan isi mangkok

| Putaran | Isi mangkok (ilustrasi dari atas) | Label |
| --- | --- | --- |
| 1 | 4–5 bulatan bakso coklat, kuah keemasan, daun bawang hijau | Bakso |
| 2 | Mie kuning melingkar, potongan ayam coklat, sawi hijau | Mie Ayam |
| 3 | Kuah merah oranye, kerupuk kuning, telur, sosis | Seblak |
| 4 | Potongan basreng oranye dan otak-otak | Jajanan |

Setelah putaran 4 kembali ke putaran 1 (loop) bila data belum selesai dimuat.

### 5.3 Spesifikasi gerak

- Satu putaran = rotasi 0° → 360° selama 900 ms, easing `cubic-bezier(0.65, 0, 0.35, 1)`. Antar putaran ada jeda diam 150 ms agar isi baru sempat terlihat jelas.
- Pergantian isi dilakukan di titik 180° (pertengahan putaran), saat kecepatan paling tinggi: isi lama scale 1 → 0.85 + opacity 1 → 0 (90 ms), lalu isi baru 0.85 → 1 + opacity 0 → 1 (90 ms). Karena terjadi saat putaran tercepat, pergantian terlihat mulus seperti sulap.
- Label nama menu berganti bersamaan: teks lama geser ke atas 8 px + fade out, teks baru masuk dari bawah 8 px + fade in (200 ms).
- Durasi minimal splash 2 putaran (sekitar 2,1 detik) meskipun data sudah siap; jika data belum siap, putaran berlanjut.
- Splash hanya ditutup di akhir putaran (saat diam), tidak pernah di tengah putaran.
- Animasi keluar: mangkok scale 1 → 0.9 + seluruh splash fade out 300 ms, bersamaan Home fade in dari bawah 12 px.
- Jika lebih dari 8 detik data belum siap: teks berubah menjadi "Koneksinya agak lambat, sebentar ya…". Jika gagal total: tombol "Coba Lagi".

### 5.4 Aturan tampil

- Tampil sekali per sesi browser (flag di sessionStorage). Membuka tab baru atau membuka ulang PWA = sesi baru.
- Tidak tampil saat pembeli membuka link langsung ke `/pesanan/[token]` agar status pesanan langsung terlihat.
- `prefers-reduced-motion`: mangkok tidak berputar; isi berganti dengan crossfade 300 ms setiap 1 detik.
- Implementasi: SVG inline + Framer Motion atau CSS keyframes; semua ilustrasi isi mangkok adalah SVG agar ringan (total < 40 KB).
- Admin tidak memakai splash ini; admin memakai loader mangkok kecil statis dengan uap bergerak.

## 6. Spesifikasi Halaman Pembeli

Setiap halaman dijelaskan dari atas ke bawah sesuai urutan tampil di layar HP (lebar acuan 390 px), lengkap dengan state kosong, loading, dan error.

### 6.1 Home

Urutan blok dari atas:

1. **Header** (tinggi 56 px, latar bg, menempel saat scroll dengan bayangan tipis): logo dummy kecil + "Warung Teras Rumah" (Fredoka 18 px) di kiri; ikon `history` (Riwayat) di kanan.
2. **Pill status warung** tepat di bawah nama: "● Buka · tutup pukul 21.00" (success) atau "● Tutup · buka lagi besok 10.00" (danger).
3. **Sapaan + pencarian**: "Mau makan apa hari ini, Kak?" (Fredoka 22 px), lalu search bar palsu (ikon `search`, placeholder "Cari bakso, seblak, es teh…"). Tap search bar membuka `/menu` dengan input langsung fokus.
4. **Strip info**: 2 pill kecil berdampingan "Gratis ongkir" (ikon `bike`) dan "Bisa makan di tempat" (ikon `armchair`), latar primary-50.
5. **Banner carousel**: rasio 2:1, radius 18 px, geser otomatis tiap 4 detik, bisa di-swipe, indikator titik di bawah. Maksimal 5 banner dari admin. Tap banner membuka tujuan yang diatur admin (kategori atau menu tertentu) atau tidak melakukan apa pun.
6. **Kategori**: 5 tombol bulat berikon ilustrasi 56 px + label di bawahnya: Bakso, Mie Ayam, Seblak, Jajanan, Minuman. Tap membuka `/menu?kategori=…`.
7. **Paling Laris**: judul section + link "Lihat semua"; kartu menu horizontal scroll (lebar kartu 148 px), maksimal 6 menu dengan penjualan terbanyak 30 hari terakhir. Jika data penjualan belum cukup, pakai menu yang ditandai admin sebagai "Favorit". Kartu pertama memakai badge bintang "#1 Terlaris".
8. **Rekomendasi Warung**: grid 2 kolom, maksimal 4 menu yang ditandai admin "Rekomendasi", latar section primary-50 dengan judul "Pilihan Teras Rumah".
9. **Seger-seger**: kartu minuman horizontal scroll, maksimal 8.
10. **Kartu info warung**: alamat, jam buka hari ini, tombol outline "Chat WhatsApp" (membuka wa.me ke nomor pemilik).
11. Ruang kosong 96 px agar konten tidak tertutup bottom nav.

State:

- Loading: skeleton untuk banner, kategori, dan 3 kartu.
- Warung tutup: muncul kartu peringatan di bawah sapaan "Warung lagi tutup, Kak. Buka lagi Senin pukul 10.00. Menu tetap bisa dilihat ya." dengan ilustrasi mangkok tertutup.
- Banner kosong: blok banner disembunyikan.
- Section tanpa data: section disembunyikan, bukan dikosongkan.

### 6.2 All Menu

1. **Header menempel**: judul "Semua Menu" + search input sungguhan (bisa diketik, tombol x untuk menghapus).
2. **Chip kategori menempel** di bawah header, scroll horizontal: Semua, Bakso, Mie Ayam, Seblak, Jajanan, Minuman.
3. **Daftar menu** dikelompokkan per kategori dengan judul section (H2) + jumlah item, grid 2 kolom (gap 12 px).

Perilaku:

- Tap chip kategori men-scroll halus ke section tersebut; saat pembeli scroll manual, chip aktif ikut berubah (scroll-spy).
- Pencarian memfilter langsung (debounce 250 ms) berdasarkan nama dan deskripsi, tidak peka huruf besar/kecil. Saat mencari, pengelompokan kategori tetap tampil tetapi hanya berisi hasil.
- Hasil kosong: ilustrasi mangkok kosong + "Menu "xyz" belum ada, Kak. Coba kata lain ya."
- Menu habis ditaruh paling akhir dalam kategorinya.

**Kartu menu (grid)**: foto 1:1 di atas; badge kiri atas ("Terlaris" accent-400 atau "Pedas" dengan ikon `flame` bila menu punya opsi level pedas); di bawah foto nama menu (maksimal 2 baris), deskripsi 1 baris text-secondary, harga di kiri bawah ("Rp12.000" atau "mulai Rp12.000" bila ada opsi berbayar), tombol bulat "+" 36 px primary-600 di kanan bawah. Jika menu sudah ada di keranjang, pojok kanan atas foto menampilkan badge jumlah (misal "2").

Tap tombol +:

- Menu tanpa grup opsi wajib: langsung masuk keranjang (qty 1), toast "Bakso Urat masuk keranjang" + animasi bounce di ikon keranjang.
- Menu dengan grup opsi wajib: membuka Detail Menu.
- Menu habis: tombol + abu-abu, tap menampilkan toast "Yah, menu ini lagi habis".

Tap area kartu selain tombol + selalu membuka Detail Menu.

### 6.3 Detail Menu (bottom sheet)

- Tinggi awal 90% layar, sudut atas 24 px, handle bar di atas, tombol x di kanan atas di atas foto.
- Foto 16:9, lalu nama (H1), deskripsi lengkap, harga dasar.
- **Grup opsi** (setiap grup dalam kartu terpisah):
  - Judul grup + label "Wajib pilih 1" (warning-100) atau "Opsional, maks. 3" (abu-abu).
  - Opsi berupa baris: radio/checkbox di kanan, nama opsi di kiri, tambahan harga "+Rp5.000" di kanan nama (kosong jika gratis).
  - Contoh: Level Pedas (wajib, radio): Tidak pedas, Level 1, Level 2, Level 3, Level 4 (dengan ikon cabai bertingkat). Porsi (wajib, radio): Biasa, Jumbo +Rp5.000. Topping (opsional, checkbox maks. 3): Telur +Rp3.000, Ceker +Rp4.000, Sosis +Rp3.000, Kerupuk +Rp2.000.
  - Opsi yang ditandai default oleh admin sudah terpilih saat sheet dibuka.
- **Stepper jumlah** di bawah grup opsi (minimal 1, maksimal 20).
- **CTA menempel di bawah**: "Tambah ke Keranjang · Rp18.000" (harga menyesuaikan opsi × qty secara real-time).
- Validasi: jika ada grup wajib belum dipilih, CTA nonaktif dan teks bantuan merah kecil di grup tersebut "Pilih level pedas dulu ya".
- Menu dengan kombinasi opsi yang sama persis digabung menjadi satu baris di keranjang; kombinasi berbeda menjadi baris terpisah.
- Menu habis: CTA diganti teks "Menu ini lagi habis" dan nonaktif.

### 6.4 Keranjang & Checkout (satu halaman)

Urutan dari atas:

1. **Header**: "Keranjang" + tombol teks "Hapus semua" (konfirmasi dulu).
2. **Daftar item**: thumbnail 56 px, nama, ringkasan opsi kecil ("Level 2 · Jumbo · +Telur"), harga baris, stepper. Mengurangi sampai 0 memunculkan konfirmasi "Hapus Bakso Urat dari keranjang?". Tap item membuka Detail Menu untuk mengubah opsi.
3. Link "+ Tambah menu lain" ke `/menu`.
4. **Cara Pesan** (wajib, tanpa pilihan default): 2 kartu pilihan besar berdampingan, "Makan di Tempat" (ikon `armchair`) dan "Diantar" (ikon `bike`, sub-teks "Gratis ongkir").
5. **Data Pemesan**:
   - Nama (wajib, 2–50 karakter), placeholder "Nama kamu".
   - Nomor WhatsApp (wajib, `inputmode=tel`, diawali 08 atau 62, 10–14 digit), teks bantuan "Untuk konfirmasi pesanan".
   - Khusus Diantar: Alamat lengkap (textarea, wajib, 10–200 karakter) dan Patokan (wajib, maks. 100 karakter, placeholder "Contoh: pagar hijau sebelah masjid").
   - Checkbox "Simpan data untuk pesanan berikutnya" (default tercentang); data disimpan di localStorage HP ini dan otomatis terisi lain kali.
6. **Pembayaran** (wajib): 2 kartu radio.
   - Cash: sub-teks berubah sesuai cara pesan, "Bayar di kasir" (dine-in) atau "Bayar ke kurir saat pesanan sampai" (delivery).
   - QRIS: "Scan, bayar, lalu upload bukti. Batas 10 menit."
7. **Ringkasan**: Subtotal, Ongkir "Gratis" (success), garis putus-putus, Total (Fredoka 20 px).
8. **Captcha** Cloudflare Turnstile (mode managed, biasanya lolos otomatis tanpa interaksi).
9. **CTA menempel**: "Pesan Sekarang · Rp45.000". Nonaktif sampai semua isian valid dan captcha lolos; tap saat ada isian kosong akan men-scroll ke isian pertama yang bermasalah.
10. **Bottom sheet konfirmasi**: "Sudah benar, Kak?" berisi ringkasan cara pesan, nama, alamat (jika ada), metode bayar, total; tombol "Ya, Pesan" dan "Cek Lagi".

State dan error:

- Keranjang kosong: ilustrasi mangkok kosong, "Keranjangmu masih kosong", tombol "Lihat Menu".
- Warung tutup: kartu peringatan di atas, CTA nonaktif bertuliskan "Warung lagi tutup".
- Menu jadi habis saat checkout: server menolak, item terkait ditandai merah "Habis, hapus dulu ya".
- Harga berubah: keranjang diperbarui otomatis + toast "Ada harga yang berubah, cek lagi ya".
- Terlalu banyak pesanan (rate limit): "Kamu baru saja memesan beberapa kali. Coba lagi beberapa menit lagi ya."
- Setelah sukses: keranjang dikosongkan, token pesanan disimpan ke riwayat lokal, pembeli diarahkan ke `/pesanan/[token]`.

### 6.5 Status Pesanan

Halaman pusat setelah memesan. Bottom nav disembunyikan; header berisi tombol kembali ke Home.

1. **Header pesanan**: "Pesanan #WTR-7K2Q9" + tombol salin kode, tanggal & jam, chip cara pesan (Makan di Tempat / Diantar).
2. **Kartu status utama**: ilustrasi sesuai status, badge status, judul dan pesan (lihat tabel).
3. **Blok pembayaran QRIS** (hanya saat Menunggu Pembayaran).
4. **Progres status**: stepper vertikal sesuai alur (Bagian 7), langkah selesai bertanda centang + jam.
5. **Detail pesanan**: data pemesan, alamat + patokan (delivery), daftar item + opsi, subtotal, ongkir, total, metode bayar.
6. **Aksi**: "Kirim Pesanan via WhatsApp" (buka wa.me pemilik dengan teks ringkasan pesanan + link), "Lihat Struk" (setelah dikonfirmasi pemilik), "Batalkan Pesanan" (hanya sebelum dikonfirmasi pemilik), "Pesan Lagi" (setelah status akhir, memasukkan item yang sama ke keranjang).

| Status | Judul di kartu | Pesan |
| --- | --- | --- |
| Menunggu Pembayaran | Selesaikan pembayaran ya | Bayar pakai QRIS di bawah sebelum waktunya habis. |
| Menunggu Konfirmasi | Pesanan sudah kami terima! | Pemilik warung sedang mengecek pesananmu. |
| Diproses | Pesananmu lagi dimasak | Sebentar lagi siap diantar. |
| Diantar | Pesanan lagi di jalan | Siapkan uang pas kalau bayar cash ya. (kalimat kedua hanya untuk cash) |
| Selesai | Selamat menikmati! | Terima kasih sudah jajan di Teras Rumah. |
| Dikonfirmasi (dine-in) | Pesananmu sudah dikonfirmasi | Silakan tunggu, makanan segera disiapkan. Bayar di kasir kalau pilih cash. |
| Ditolak | Maaf, pesanan tidak bisa diproses | Alasan dari pemilik + tombol "Hubungi Warung". |
| Kedaluwarsa | Waktu pembayaran habis | Pesanan dibatalkan otomatis. Kamu bisa pesan lagi. |
| Dibatalkan | Pesanan dibatalkan | Pesanan ini sudah kamu batalkan. |

**Blok pembayaran QRIS**:

- Timer hitung mundur besar "09:42" (warning; menjadi danger di bawah 2 menit).
- Total yang harus dibayar (Fredoka 28 px) + tombol salin nominal.
- Gambar QRIS penjual (dari pengaturan admin) dalam kartu putih, bisa diperbesar dengan tap.
- Tombol "Simpan Gambar QRIS" (unduh PNG), karena pembeli di HP biasanya scan dari galeri di aplikasi e-wallet/m-banking.
- Langkah singkat bernomor: Simpan atau scan QRIS → Bayar sesuai total → Upload bukti bayar.
- Area upload bukti: kotak garis putus-putus "Pilih foto bukti bayar" (kamera atau galeri, JPG/PNG/WEBP, maks. 5 MB). Setelah dipilih tampil pratinjau + tombol ganti foto.
- CTA "Kirim Bukti Pembayaran" (aktif setelah ada foto). Sukses: status menjadi Menunggu Konfirmasi.
- Timer habis: blok diganti pesan kedaluwarsa dan tombol "Pesan Lagi".

Pembaruan status: halaman mengecek status setiap 10 detik selama status belum final (atau via SSE). Saat status berubah: toast "Status pesananmu berubah" + getar singkat (bila didukung). Polling berhenti saat tab tidak aktif dan lanjut saat aktif lagi.

### 6.6 Struk

- Kartu putih bergaya struk kasir dengan tepi bawah bergerigi, lebar maks. 360 px, di tengah layar.
- Isi berurutan: logo + nama warung, alamat, nomor WA; garis putus-putus; kode pesanan, tanggal & jam, cara pesan, nama pemesan; daftar item (nama, opsi kecil, qty × harga, total baris); subtotal, ongkir Gratis, TOTAL; metode bayar; cap status miring ("LUNAS" success untuk QRIS terverifikasi atau cash yang sudah selesai; "BAYAR DI TEMPAT" warning untuk cash yang belum selesai); penutup "Terima kasih sudah jajan di Teras Rumah!".
- Tombol: "Unduh Struk" (PNG, dirender dari elemen struk) dan "Bagikan" (Web Share API; jika tidak didukung, salin link).
- Struk hanya tersedia setelah pemilik mengonfirmasi pesanan.

### 6.7 Riwayat Pesanan

- Judul "Riwayat Pesanan" + catatan kecil "Riwayat tersimpan di HP ini saja."
- Daftar kartu terbaru di atas: kode, tanggal, ringkasan item ("Bakso Urat + 2 lainnya"), total, badge status. Tap membuka Status Pesanan.
- Pesanan yang masih berjalan ditandai titik berdenyut dan selalu di posisi teratas.
- Data: daftar token di localStorage (maksimal 30 terakhir), status terbaru diambil dari server sekaligus dalam satu request.
- Kosong: "Belum ada pesanan di HP ini" + tombol "Mulai Pesan".
- Link di bawah: "Pesananmu tidak ada di sini? Cek pakai kode pesanan."

### 6.8 Cek Pesanan

Form 2 isian, kode pesanan (format WTR-XXXXX) dan nomor WhatsApp yang dipakai saat memesan. Jika cocok, pembeli diarahkan ke Status Pesanan dan pesanan ditambahkan ke riwayat lokal. Jika tidak cocok: "Pesanan tidak ditemukan. Cek lagi kode dan nomornya ya." Dilindungi captcha + rate limit (5 percobaan per 10 menit).

## 7. Alur Status Pesanan

Semua pesanan berhenti di Menunggu Konfirmasi sampai pemilik bertindak; setelah diterima, dine-in langsung selesai sebagai Dikonfirmasi, sedangkan delivery lanjut ke Diproses, Diantar, lalu Selesai.

&#91;embedded content: alur status pesanan · 9 status, 4 kombinasi cara pesan & bayar\]

QRIS masuk lewat Menunggu Pembayaran (10 menit untuk upload bukti), sedangkan cash langsung ke Menunggu Konfirmasi.

| Kombinasi | Urutan status |
| --- | --- |
| Dine-in + Cash | Menunggu Konfirmasi → Dikonfirmasi |
| Dine-in + QRIS | Menunggu Pembayaran → Menunggu Konfirmasi → Dikonfirmasi |
| Delivery + Cash (COD) | Menunggu Konfirmasi → Diproses → Diantar → Selesai |
| Delivery + QRIS | Menunggu Pembayaran → Menunggu Konfirmasi → Diproses → Diantar → Selesai |

Aturan server: status hanya bisa maju sesuai panah di atas; Ditolak, Kedaluwarsa, Dibatalkan, Dikonfirmasi, dan Selesai adalah status akhir dan tidak bisa diubah lagi. Setiap perubahan dicatat di `order_status_logs` beserta pelakunya (pembeli, pemilik, atau sistem).

## 8. Spesifikasi Dashboard Admin

Dashboard admin dirancang untuk dipakai satu tangan di HP pemilik: tombol besar, teks pesanan mudah dibaca dari jarak dapur, dan setiap tindakan utama selesai dalam 1–2 tap.

**Prinsip khusus admin**

- Bottom nav 4 tab: Pesanan (`clipboard-list`, badge jumlah perlu tindakan), Menu (`utensils`), Laporan (`bar-chart-3`), Pengaturan (`settings`).
- Ukuran teks isi pesanan 16 px (lebih besar dari sisi pembeli); tombol aksi utama tinggi 56 px, menempel di bawah.
- Tindakan berisiko (Tolak, Hapus menu) selalu memakai konfirmasi; tindakan ringan (toggle stok) memakai toast dengan tombol "Urungkan" selama 5 detik.
- Dipasang sebagai PWA terpisah dengan nama "Admin Teras Rumah" (start URL `/admin`).

### 8.1 Login & onboarding

- Login: username + password, tombol tampilkan password, checkbox "Ingat saya" (sesi 30 hari, default 7 hari). Salah 5 kali dalam 15 menit dikunci sementara.
- Akun pemilik dibuat lewat seed saat deploy; tidak ada halaman daftar.
- Login pertama menampilkan checklist onboarding yang bisa ditutup: Pasang ke Home Screen (panduan bergambar Android & iPhone), Aktifkan notifikasi, Aktifkan suara, Upload QRIS, Atur jam buka, Cek daftar menu.

### 8.2 Pesanan (beranda admin)

1. **Header**: "Pesanan" + switch besar "Terima Pesanan" (Buka/Tutup manual). Mematikannya membuka sheet pilihan: tutup sampai jam buka berikutnya atau tutup sampai jam tertentu, plus pesan opsional untuk pembeli.
2. **Ringkasan hari ini**: 3 kartu kecil, Pesanan hari ini, Omzet hari ini, Perlu tindakan.
3. **Tab**: Perlu Tindakan (Menunggu Konfirmasi), Berjalan (Menunggu Pembayaran, Diproses, Diantar), Selesai (Selesai, Dikonfirmasi, Ditolak, Kedaluwarsa, Dibatalkan, dengan filter tanggal).
4. **Kartu pesanan**: kode + waktu relatif ("3 menit lalu"), chip Dine-in/Delivery, chip Cash/QRIS, nama pembeli, ringkasan item, total, badge status, dan satu tombol aksi cepat sesuai status (lihat tabel). Pesanan Menunggu Pembayaran tampil redup dengan label "Pembeli belum bayar · sisa 06:12".

| Status pesanan | Tombol aksi cepat di kartu |
| --- | --- |
| Menunggu Konfirmasi (QRIS) | Cek Bukti (buka detail) |
| Menunggu Konfirmasi (Cash) | Konfirmasi |
| Diproses (delivery) | Antar Sekarang |
| Diantar | Tandai Selesai |

**Pesanan baru masuk**:

- Bunyi notifikasi (lonceng hangat, 3 kali) + getar, banner menempel di atas "Pesanan baru! #WTR-7K2Q9 · Rp45.000" yang bisa di-tap.
- Bunyi berulang tiap 30 detik selama masih ada pesanan Menunggu Konfirmasi yang belum dibuka (bisa dimatikan di Pengaturan).
- Browser mewajibkan interaksi sebelum suara bisa diputar, jadi saat dashboard dibuka tampil tombol "Aktifkan Suara" sampai ditekan.
- Web Push dikirim ke HP pemilik meskipun dashboard tertutup; tap notifikasi membuka detail pesanan.
- Daftar diperbarui real-time via SSE, dengan polling 15 detik sebagai cadangan.

### 8.3 Detail Pesanan

1. Header: kode, waktu, badge status, chip cara pesan dan metode bayar.
2. **Pembeli**: nama, nomor WA dengan tombol "Chat WA" dan "Telepon". Delivery: alamat + patokan dalam kartu kuning lembut, tombol "Salin Alamat" dan "Buka di Maps" (link pencarian Google Maps, tanpa API).
3. **Item pesanan** dalam teks besar, qty tebal di kiri ("2×"), opsi di bawah nama dengan level pedas diberi ikon cabai agar mudah dibaca dapur.
4. Total dan metode bayar.
5. **Bukti QRIS** (jika ada): thumbnail besar, tap untuk layar penuh dengan pinch-zoom. Kotak pengingat: "Cocokkan nominal Rp45.000 dan waktu transaksi di aplikasi bank/merchant. Jangan hanya percaya screenshot."
6. **Riwayat status**: timeline kecil berisi status dan jam.
7. Tombol "Kirim Update ke Pembeli via WA": membuka wa.me ke nomor pembeli dengan teks template sesuai status saat ini.
8. **Action bar menempel di bawah**: tombol utama sesuai status + tombol "Tolak" (outline danger) saat status Menunggu Konfirmasi.

**Sheet Tolak Pesanan**: alasan wajib dipilih, Pembayaran tidak ditemukan / Nominal tidak sesuai / Menu habis / Alamat di luar jangkauan / Warung sudah tutup / Lainnya (isian teks). Alasan tampil di halaman pembeli. Untuk QRIS yang sudah dibayar lalu ditolak, muncul pengingat "Jangan lupa refund manual ke pembeli" + tombol Chat WA.

### 8.4 Kelola Menu

- Pencarian + chip kategori di atas; daftar menu per kategori.
- Baris menu: thumbnail 48 px, nama, harga, switch Tersedia/Habis di kanan (langsung tersimpan, toast + Urungkan). Tap baris membuka form edit.
- Tombol mengambang "+ Tambah Menu".
- Mode "Atur Urutan" (tombol di header) untuk menyusun ulang dengan drag handle.

**Form menu**:

- Foto: pilih dari kamera/galeri, dipotong otomatis 1:1 di tengah (bisa digeser), dikompres ke WebP maks. 1200 px.
- Nama (wajib, maks. 50), Kategori (wajib, pilih), Deskripsi (opsional, maks. 120), Harga dasar (wajib, input angka dengan format Rp otomatis).
- Switch: Tersedia, Tandai Favorit (muncul di Paling Laris bila data penjualan kurang), Tandai Rekomendasi (muncul di Home).
- **Grup opsi**: tombol "+ Tambah Grup Opsi" dengan template cepat (Level Pedas, Porsi, Topping) yang bisa disalin lalu diedit. Setiap grup: nama, tipe (Pilih satu / Pilih beberapa), Wajib (switch), Maksimal pilihan (untuk Pilih beberapa), daftar opsi (nama, tambahan harga, default). Grup dan opsi bisa diurutkan dan dihapus.
- Tombol "Simpan" menempel di bawah; "Hapus Menu" di paling bawah form (soft delete agar laporan lama tetap benar).

### 8.5 Laporan

- Filter periode: Hari ini, 7 hari, 30 hari, pilih tanggal.
- Kartu angka: jumlah pesanan berhasil, omzet, rata-rata nilai pesanan.
- Perbandingan Cash vs QRIS dan Dine-in vs Delivery (bar horizontal sederhana).
- Grafik batang omzet per hari untuk periode terpilih.
- 5 menu terlaris (qty dan omzet).
- Yang dihitung hanya pesanan berstatus Selesai (delivery) dan Dikonfirmasi (dine-in).
- Unduh CSV (prioritas P1).

### 8.6 Pengaturan

| Bagian | Isi |
| --- | --- |
| Profil warung | Nama, alamat, nomor WhatsApp warung, logo (opsional, default logo dummy) |
| Jam operasional | Per hari Senin–Minggu: switch buka, jam buka & tutup. Status Tutup Sementara (dari switch di halaman Pesanan) tampil di sini juga |
| QRIS | Upload gambar QRIS, nama merchant, pratinjau seperti yang dilihat pembeli |
| Banner | Daftar banner (maks. 5): gambar 2:1, judul internal, tujuan tap (tidak ada / kategori / menu), switch aktif, urutan |
| Kategori | Tambah, ubah nama, ikon ilustrasi, urutan, sembunyikan |
| Notifikasi | Status Web Push + tombol "Kirim Tes", switch & tes suara, switch bunyi berulang, nomor WA notifikasi (fase 2) |
| Akun | Ganti password, keluar |
| Bantuan | Panduan pasang ke Home Screen Android & iPhone |

## 9. User Stories & Acceptance Criteria

P0 wajib ada saat rilis pertama; P1 dikerjakan bila waktu cukup atau segera setelah rilis.

### 9.1 Pembeli

| ID | User story | Acceptance criteria | Prioritas |
| --- | --- | --- | --- |
| B-01 | Sebagai pembeli, saya melihat animasi pembuka yang menyenangkan saat membuka web. | Splash tampil sekali per sesi, minimal 2 putaran, isi berganti di titik 180°, tidak muncul saat membuka link pesanan langsung, versi reduced-motion tersedia. | P0 |
| B-02 | Sebagai pembeli, saya tahu warung sedang buka atau tutup. | Pill status sesuai jam operasional dan status tutup manual; saat tutup, checkout nonaktif dengan pesan jam buka berikutnya. | P0 |
| B-03 | Sebagai pembeli, saya bisa melihat dan mencari semua menu. | Menu tampil per kategori, filter chip dan pencarian bekerja < 300 ms, menu habis tampil di akhir dengan tanda Habis. | P0 |
| B-04 | Sebagai pembeli, saya bisa memilih level pedas, porsi, dan topping. | Grup wajib harus dipilih sebelum tombol tambah aktif; batas maksimal topping dipatuhi; harga berubah real-time. | P0 |
| B-05 | Sebagai pembeli, isi keranjang saya tidak hilang saat menutup browser. | Keranjang tersimpan di localStorage; harga dan ketersediaan divalidasi ulang ke server saat keranjang dibuka. | P0 |
| B-06 | Sebagai pembeli, saya bisa memesan tanpa membuat akun. | Checkout hanya meminta cara pesan, nama, WA (+ alamat & patokan untuk delivery), metode bayar, dan lolos captcha. | P0 |
| B-07 | Sebagai pembeli, saya bisa membayar dengan QRIS dan mengirim bukti. | QRIS dan total tampil, timer 10 menit berjalan, gambar QRIS bisa disimpan, upload maks. 5 MB berhasil mengubah status menjadi Menunggu Konfirmasi. | P0 |
| B-08 | Sebagai pembeli, saya bisa melihat status pesanan terbaru. | Status diperbarui otomatis ≤ 10 detik setelah pemilik mengubahnya, disertai toast. | P0 |
| B-09 | Sebagai pembeli, saya bisa melihat riwayat pesanan di HP yang sama. | Riwayat menampilkan maksimal 30 pesanan terakhir dengan status terbaru dari server. | P0 |
| B-10 | Sebagai pembeli, saya bisa mengunduh dan membagikan struk. | Struk tersedia setelah dikonfirmasi; unduh menghasilkan PNG terbaca; tombol Bagikan memakai Web Share API atau salin link. | P0 |
| B-11 | Sebagai pembeli, saya bisa membatalkan pesanan sebelum dikonfirmasi. | Tombol batal hanya muncul di Menunggu Pembayaran dan Menunggu Konfirmasi; setelah batal status menjadi Dibatalkan dan pemilik melihatnya. | P0 |
| B-12 | Sebagai pembeli, saya bisa mengirim ringkasan pesanan ke WA pemilik. | Tombol membuka wa.me ke nomor warung dengan teks berisi kode, item, total, cara pesan, dan link pesanan. | P0 |
| B-13 | Sebagai pembeli, saya bisa memasang web ke Home Screen. | Manifest valid, ikon tersedia, prompt pasang muncul di Android; Lighthouse PWA installable lolos. | P1 |
| B-14 | Sebagai pembeli di HP lain, saya bisa menemukan pesanan saya. | Kode pesanan + nomor WA yang cocok membuka status pesanan; 5 percobaan gagal per 10 menit diblokir sementara. | P1 |
| B-15 | Sebagai pembeli, saya bisa memesan ulang dengan cepat. | Tombol Pesan Lagi memasukkan item yang masih tersedia ke keranjang dan memberi tahu item yang habis. | P1 |

### 9.2 Pemilik (admin)

| ID | User story | Acceptance criteria | Prioritas |
| --- | --- | --- | --- |
| A-01 | Sebagai pemilik, saya login dengan aman. | Password di-hash bcrypt, sesi via cookie httpOnly, 5 kali salah dalam 15 menit dikunci sementara. | P0 |
| A-02 | Sebagai pemilik, saya langsung tahu ada pesanan baru. | Pesanan muncul di dashboard ≤ 5 detik dengan bunyi + banner; Web Push diterima saat dashboard tertutup (Android dan iPhone PWA). | P0 |
| A-03 | Sebagai pemilik, saya bisa memverifikasi bukti QRIS. | Bukti bisa diperbesar layar penuh; tombol Terima mengubah status (dine-in: Dikonfirmasi, delivery: Diproses); Tolak wajib alasan. | P0 |
| A-04 | Sebagai pemilik, saya bisa mengonfirmasi pesanan cash. | Satu tap Konfirmasi; dine-in menjadi Dikonfirmasi, delivery menjadi Diproses. | P0 |
| A-05 | Sebagai pemilik, saya bisa mengubah status delivery. | Diproses → Diantar → Selesai, masing-masing satu tap dengan konfirmasi ringan; status tidak bisa mundur. | P0 |
| A-06 | Sebagai pemilik, saya bisa menandai menu habis. | Switch Habis langsung berlaku di sisi pembeli ≤ 10 detik; ada tombol Urungkan. | P0 |
| A-07 | Sebagai pemilik, saya bisa menambah dan mengubah menu beserta opsinya. | Form menyimpan foto, harga, kategori, grup opsi; validasi wajib berjalan; perubahan tidak mengubah harga di pesanan lama. | P0 |
| A-08 | Sebagai pemilik, saya bisa membuka/menutup warung manual. | Switch Terima Pesanan langsung menutup checkout pembeli dengan pesan yang diisi. | P0 |
| A-09 | Sebagai pemilik, saya bisa mengatur jam buka dan QRIS. | Jam per hari tersimpan dalam zona Asia/Jakarta; gambar QRIS baru langsung dipakai di pesanan berikutnya. | P0 |
| A-10 | Sebagai pemilik, saya bisa melihat laporan penjualan. | Angka hanya menghitung pesanan berhasil; filter periode bekerja; 5 menu terlaris tampil. | P1 |
| A-11 | Sebagai pemilik, saya bisa mengelola banner dan kategori. | CRUD banner (maks. 5) dan kategori, termasuk urutan dan status aktif. | P1 |
| A-12 | Sebagai pemilik, saya bisa mengirim update ke pembeli via WA. | Tombol membuka wa.me nomor pembeli dengan template sesuai status. | P1 |

### 9.3 Kriteria non-fungsional

- Performa: Lighthouse mobile Performance ≥ 85, LCP < 2,5 detik di 4G, JavaScript awal halaman pembeli < 200 KB gzip.
- Kompatibilitas: Chrome Android 100+, Safari iOS 16.4+, Chrome/Edge/Firefox/Safari desktop versi terbaru.
- Aksesibilitas: kontras teks minimal WCAG AA, semua tombol ikon punya label, form punya label dan pesan error yang dibacakan screen reader.
- Semua waktu tampil dalam WIB (Asia/Jakarta), format tanggal "5 Okt 2026, 14.30".

## 10. Arsitektur Teknis

Frontend Next.js dan backend Express (sesuai kebiasaanmu) dengan database PostgreSQL lewat Prisma, gambar di Supabase Storage, dan notifikasi lewat Web Push + SSE.

### 10.1 Stack

| Lapisan | Pilihan | Alasan |
| --- | --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS | Sesuai kebiasaan, SSR untuk halaman menu yang cepat |
| State & data | Zustand (keranjang, persist ke localStorage), TanStack Query (fetch, polling, cache) | Ringan dan sederhana |
| Form | React Hook Form + Zod | Validasi sama dengan backend |
| Animasi | Framer Motion | Splash, bottom sheet, transisi |
| PWA | Serwist (service worker untuk Next.js) | Pengganti next-pwa yang masih dirawat |
| Struk | html-to-image | Render elemen struk ke PNG |
| Ikon | lucide-react | Sesuai design system |
| Backend | Express + TypeScript | Sesuai kebiasaan |
| ORM | Prisma | Skema jelas, migrasi otomatis, type-safe; ramah untuk yang jarang memakai database |
| Database | PostgreSQL (Supabase, paket gratis) | Data relasional (pesanan-item-opsi) + kolom JSON untuk snapshot opsi |
| File | Supabase Storage: bucket publik (foto menu, banner, QRIS) dan bucket privat (bukti bayar) | Satu penyedia dengan database; bukti bayar tidak bisa diakses publik |
| Gambar | multer + sharp | Validasi, kompres ke WebP, hapus metadata EXIF |
| Keamanan | helmet, cors, express-rate-limit, bcrypt, jsonwebtoken, Cloudflare Turnstile | Lihat 10.6 |
| Notifikasi | web-push (VAPID), SSE untuk real-time dashboard | Gratis |
| Penjadwalan | node-cron (tiap 1 menit) | Mengubah pesanan lewat batas bayar menjadi Kedaluwarsa |

**Kenapa PostgreSQL, bukan MongoDB?** Pesanan, item, opsi, dan laporan saling terhubung dan butuh angka yang konsisten (total, omzet). Database relasional menjaga konsistensi itu, dan Prisma membuatnya mudah dipakai tanpa menulis SQL manual.

### 10.2 Struktur proyek

Monorepo pnpm workspace:

- `apps/web`: Next.js (halaman pembeli + `/admin`).
- `apps/api`: Express (REST API, SSE, cron, push).
- `packages/shared`: skema Zod, tipe TypeScript, enum status, fungsi hitung harga yang dipakai bersama.

### 10.3 Hosting & domain

- Frontend di Vercel (gratis). Backend di Railway (perkiraan sekitar US$5/bulan) karena SSE, cron, dan push membutuhkan server yang selalu menyala; layanan gratis yang "tidur" membuat notifikasi telat.
- Alternatif hemat: satu VPS lokal untuk frontend + backend.
- Wajib domain sendiri, misalnya `warungterasrumah.com` (web) dan `api.warungterasrumah.com` (API), agar cookie login admin bekerja aman di subdomain yang sama (`Domain=.warungterasrumah.com; SameSite=Lax; Secure; HttpOnly`).
- HTTPS wajib (syarat PWA dan Web Push).

### 10.4 Skema data

Semua uang disimpan sebagai integer rupiah. Semua waktu disimpan UTC dan ditampilkan dalam Asia/Jakarta.

| Tabel | Kolom penting | Catatan |
| --- | --- | --- |
| admin\_users | id, username, password\_hash, created\_at | Satu akun, dibuat via seed |
| store\_settings | id (=1), name, address, whatsapp, logo\_url, qris\_image\_url, qris\_merchant\_name, is\_manually\_closed, closed\_until, closed\_message, sound\_repeat | Satu baris |
| operating\_hours | day\_of\_week (0–6), is\_open, open\_time, close\_time | 7 baris |
| categories | id, name, slug, icon, sort\_order, is\_active | Bakso, Mie Ayam, Seblak, Jajanan, Minuman |
| menu\_items | id, category\_id, name, slug, description, base\_price, image\_url, is\_available, is\_favorite, is\_recommended, sort\_order, deleted\_at, created\_at, updated\_at | Soft delete |
| option\_groups | id, menu\_item\_id, name, type (SINGLE/MULTIPLE), is\_required, max\_select, sort\_order | Level Pedas, Porsi, Topping |
| options | id, option\_group\_id, name, price\_delta, is\_default, is\_active, sort\_order | price\_delta boleh 0 |
| orders | id (uuid), code (unik), access\_token (unik), order\_type (DINE\_IN/DELIVERY), payment\_method (CASH/QRIS), status, customer\_name, customer\_phone, address, landmark, subtotal, delivery\_fee (0), total, payment\_deadline, payment\_proof\_path, payment\_proof\_uploaded\_at, rejection\_reason, ip\_hash, created\_at, updated\_at | Nomor WA dinormalisasi ke format 62… |
| order\_items | id, order\_id, menu\_item\_id, name\_snapshot, base\_price\_snapshot, options\_snapshot (JSON: grup, opsi, price\_delta), unit\_price, quantity, line\_total | Snapshot agar perubahan menu tidak mengubah pesanan lama |
| order\_status\_logs | id, order\_id, from\_status, to\_status, actor (CUSTOMER/ADMIN/SYSTEM), note, created\_at | Untuk timeline status |
| banners | id, image\_url, title, target\_type (NONE/CATEGORY/MENU), target\_id, is\_active, sort\_order | Maks. 5 aktif |
| push\_subscriptions | id, endpoint (unik), p256dh, auth, user\_agent, created\_at | HP pemilik yang menerima push |

Enum status pesanan: `AWAITING_PAYMENT`, `AWAITING_CONFIRMATION`, `CONFIRMED`, `PROCESSING`, `DELIVERING`, `COMPLETED`, `REJECTED`, `EXPIRED`, `CANCELLED`.

### 10.5 API

**Publik** (prefix `/api`):

| Method & path | Fungsi |
| --- | --- |
| GET /store | Profil warung, jam buka, status buka (dihitung server) |
| GET /home | Banner aktif, paling laris, rekomendasi, minuman |
| GET /menu | Kategori + menu + grup opsi |
| POST /cart/validate | Cek harga & ketersediaan isi keranjang |
| POST /orders | Buat pesanan (item, opsi, cara pesan, metode bayar, data pembeli, token Turnstile); balikan code + access\_token |
| GET /orders/:token | Detail & status pesanan |
| GET /orders/:token/events | SSE perubahan status (opsional; cadangan polling) |
| POST /orders/:token/payment-proof | Upload bukti QRIS (multipart) |
| POST /orders/:token/cancel | Batalkan oleh pembeli |
| POST /orders/status-batch | Status banyak pesanan sekaligus (Riwayat) |
| POST /orders/lookup | Cari pesanan dengan code + nomor WA + Turnstile |

**Admin** (prefix `/api/admin`, wajib cookie sesi):

| Method & path | Fungsi |
| --- | --- |
| POST /auth/login, POST /auth/logout, GET /auth/me, PATCH /auth/password | Autentikasi |
| GET /orders?tab=&date= | Daftar pesanan per tab |
| GET /orders/:id | Detail pesanan |
| GET /orders/:id/proof | Signed URL bukti bayar (berlaku 5 menit) |
| POST /orders/:id/confirm | Konfirmasi / terima pembayaran |
| POST /orders/:id/reject | Tolak dengan alasan |
| POST /orders/:id/advance | Maju ke status berikutnya (Diantar, Selesai) |
| GET /events | SSE pesanan baru & perubahan |
| GET, POST /menu; GET, PATCH, DELETE /menu/:id | CRUD menu + grup opsi |
| PATCH /menu/:id/availability, PATCH /menu/reorder | Stok & urutan |
| CRUD /categories, CRUD /banners | Kategori & banner |
| GET, PATCH /settings; PUT /hours; POST /settings/qris | Pengaturan |
| GET /reports?from=&to= | Laporan |
| POST /push/subscribe, DELETE /push/subscribe, POST /push/test | Web Push |
| POST /uploads/image | Upload foto menu/banner/logo |

### 10.6 Logika bisnis & keamanan

- **Harga dihitung ulang di server** dari `menu_items` dan `options`; angka dari browser diabaikan. Validasi: grup wajib terpilih, jumlah pilihan ≤ max\_select, opsi milik menu yang benar, menu tersedia, qty 1–20, maksimal 30 baris item.
- **Warung tutup** diperiksa ulang saat POST /orders.
- **Kode pesanan** `WTR-` + 5 karakter dari alfabet tanpa huruf yang membingungkan (tanpa 0, O, 1, I). **Access token** 24 byte acak (base64url); hanya token yang bisa membuka detail pesanan.
- **State machine** di server: hanya transisi pada Bagian 7 yang diizinkan; transisi lain ditolak (409).
- **Kedaluwarsa**: cron tiap menit + pengecekan saat pesanan dibaca. Upload bukti hanya diterima saat AWAITING\_PAYMENT dan sebelum `payment_deadline` (toleransi 30 detik).
- **Turnstile** diverifikasi di server pada POST /orders dan /orders/lookup.
- **Rate limit**: POST /orders 3 per 10 menit per IP dan 5 per jam per nomor WA; upload bukti 5 per 10 menit per pesanan; login 5 per 15 menit; lookup 5 per 10 menit.
- **Upload**: cek tipe file dari isi file (bukan nama), maks. 5 MB, re-encode dengan sharp (menghapus metadata seperti lokasi GPS), bukti bayar di bucket privat.
- **Admin**: bcrypt cost 12, JWT di cookie httpOnly, pengecekan header Origin untuk semua request admin yang mengubah data.
- **Header & CORS**: helmet, CORS hanya untuk domain web sendiri.
- **Data pribadi**: hanya nama, WA, alamat yang dikumpulkan; halaman pesanan diberi `noindex`; data pribadi tidak ditulis ke log; bukti bayar dihapus otomatis setelah 90 hari. Sejalan dengan prinsip minimalisasi data UU PDP.

### 10.7 PWA & notifikasi

- Dua manifest: pembeli (`start_url: /`, scope `/`, nama "Warung Teras Rumah") dan admin (`start_url: /admin`, scope `/admin`, nama "Admin Teras Rumah"). `theme_color` #E14B4B, `background_color` #FFF9F4, ikon 192 px, 512 px, dan maskable.
- Service worker: precache app shell, foto menu stale-while-revalidate, GET /menu network-first dengan cadangan cache, halaman `/offline`. POST dan data pesanan tidak pernah di-cache.
- Web Push admin: kunci VAPID di environment, payload `{title, body, url}`; langganan yang kedaluwarsa (410) dihapus otomatis.
- Pembeli tidak menerima push di MVP; status pesanan diperbarui lewat polling/SSE di halaman pesanan.

### 10.8 Environment variable

`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORAGE_PUBLIC_BUCKET`, `STORAGE_PRIVATE_BUCKET`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL`, `ADMIN_SEED_USERNAME`, `ADMIN_SEED_PASSWORD`, `WA_GATEWAY_TOKEN` (opsional, fase 2).

## 11. Data Awal, Rencana Kerja & Asumsi

Target rilis dalam 7 hari bisa dicapai jika fitur P0 dikerjakan lebih dulu dan menu asli (nama, harga, foto) sudah siap paling lambat hari ke-6.

### 11.1 Data dummy menu (seed)

Nama dan harga di bawah hanya contoh untuk desain dan seed database; ganti dengan data asli warung sebelum rilis.

**Makanan (15)**

| Kategori | Menu | Harga dasar | Grup opsi |
| --- | --- | --- | --- |
| Bakso | Bakso Urat | Rp15.000 | Porsi, Topping |
| Bakso | Bakso Halus | Rp13.000 | Porsi, Topping |
| Bakso | Bakso Telur | Rp16.000 | Porsi, Topping |
| Bakso | Bakso Mercon | Rp17.000 | Level Pedas, Porsi |
| Mie Ayam | Mie Ayam Biasa | Rp12.000 | Level Pedas, Porsi, Topping |
| Mie Ayam | Mie Ayam Bakso | Rp16.000 | Level Pedas, Porsi, Topping |
| Mie Ayam | Mie Ayam Ceker | Rp15.000 | Level Pedas, Porsi, Topping |
| Mie Ayam | Mie Ayam Pangsit | Rp14.000 | Level Pedas, Porsi, Topping |
| Seblak | Seblak Original | Rp12.000 | Level Pedas, Topping |
| Seblak | Seblak Komplit | Rp18.000 | Level Pedas, Topping |
| Seblak | Seblak Ceker | Rp16.000 | Level Pedas, Topping |
| Jajanan | Basreng Pedas | Rp10.000 | Level Pedas |
| Jajanan | Otak-otak Goreng | Rp10.000 | - |
| Jajanan | Cireng Bumbu Rujak | Rp8.000 | Level Pedas |
| Jajanan | Tahu Bakso | Rp10.000 | - |

**Minuman (20)**: Es Teh Manis Rp4.000, Teh Manis Hangat Rp4.000, Es Teh Tawar Rp3.000, Es Jeruk Rp6.000, Jeruk Hangat Rp6.000, Es Lemon Tea Rp7.000, Es Teh Susu Rp7.000, Kopi Hitam Rp5.000, Es Kopi Susu Rp10.000, Es Cappuccino Rp8.000, Es Milo Rp8.000, Es Susu Coklat Rp8.000, Es Cincau Rp7.000, Es Timun Serut Rp8.000, Es Campur Rp12.000, Es Buah Rp12.000, Es Kelapa Muda Rp10.000, Jus Alpukat Rp12.000, Jus Mangga Rp10.000, Air Mineral Rp4.000. Minuman manis memakai grup opsi "Tingkat Manis" (wajib, pilih satu: Normal, Kurang Manis, Tanpa Gula; semua Rp0).

**Template grup opsi**

| Grup | Tipe | Opsi (tambahan harga) |
| --- | --- | --- |
| Level Pedas | Wajib, pilih satu | Tidak Pedas, Level 1 (default), Level 2, Level 3, Level 4 (semua Rp0) |
| Porsi | Wajib, pilih satu | Biasa (default, Rp0), Jumbo (+Rp5.000) |
| Topping | Opsional, maks. 3 | Telur (+Rp3.000), Ceker (+Rp4.000), Sosis (+Rp3.000), Kerupuk (+Rp2.000), Bakso Tambahan (+Rp4.000) |
| Tingkat Manis | Wajib, pilih satu | Normal (default), Kurang Manis, Tanpa Gula (semua Rp0) |

Data awal lain: jam buka dummy setiap hari 10.00–21.00 WIB; 3 banner dummy ("Gratis Ongkir Tanpa Minimal", "Seblak Level 4 Berani Coba?", "Paket Bakso + Es Teh"); nomor WA dan gambar QRIS diisi pemilik saat onboarding.

### 11.2 Rencana kerja 7 hari

1. **Hari 1, fondasi**: monorepo, skema Prisma + migrasi + seed, Supabase (database & storage), token desain di Tailwind, deploy kerangka ke Vercel dan Railway dengan domain.
2. **Hari 2, jelajah menu**: API store/home/menu, Splash (versi dasar), Home, All Menu, Detail Menu, keranjang Zustand.
3. **Hari 3, checkout**: halaman Keranjang & Checkout, POST /orders dengan hitung harga server, Turnstile, rate limit, halaman Status Pesanan, alur cash.
4. **Hari 4, QRIS & struk**: blok pembayaran QRIS, upload bukti, timer & cron kedaluwarsa, Struk PNG, Riwayat.
5. **Hari 5, admin pesanan**: login, daftar & detail pesanan, konfirmasi/tolak/maju status, SSE, bunyi notifikasi.
6. **Hari 6, admin menu & PWA**: CRUD menu + grup opsi, pengaturan (jam, QRIS, buka/tutup), Web Push, manifest & service worker, input menu asli.
7. **Hari 7, poles & rilis**: animasi splash final, uji end-to-end di HP Android dan iPhone (dine-in/delivery × cash/QRIS), perbaikan bug, rilis.

Setelah rilis (P1): laporan, kelola banner & kategori dari dashboard (sementara lewat seed), Cek Pesanan, Pesan Lagi, unduh CSV, notifikasi WA otomatis lewat gateway.

### 11.3 Asumsi & pertanyaan terbuka

- Tidak ada batas area antar; pesanan di luar jangkauan ditolak pemilik dengan alasan "Alamat di luar jangkauan".
- Jam operasional tidak melewati tengah malam.
- Pembeli boleh mengisi keranjang saat warung tutup, tetapi tidak bisa checkout.
- Foto menu asli disiapkan pemilik; sementara memakai ilustrasi placeholder.
- Domain dan biaya hosting backend ditanggung pemilik.
- Pertanyaan terbuka: apakah perlu notifikasi WA otomatis ke pemilik sejak hari pertama (berbayar), atau cukup Web Push + bunyi dulu?
