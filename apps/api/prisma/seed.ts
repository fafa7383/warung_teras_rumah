// Seed data awal (PRD 11.1). Aman dijalankan berulang: data yang sudah ada tidak ditimpa,
// sehingga perubahan pemilik lewat dashboard tidak hilang.
// Nama & harga menu hanya contoh — ganti dengan data asli warung sebelum rilis.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import type { OptionGroupType } from '@wtr/shared';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL / DIRECT_URL belum diisi di apps/api/.env');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

interface GroupTemplate {
  name: string;
  type: OptionGroupType;
  isRequired: boolean;
  maxSelect: number | null;
  options: { name: string; priceDelta: number; isDefault?: boolean }[];
}

const LEVEL_PEDAS: GroupTemplate = {
  name: 'Level Pedas',
  type: 'SINGLE',
  isRequired: true,
  maxSelect: null,
  options: [
    { name: 'Tidak Pedas', priceDelta: 0 },
    { name: 'Level 1', priceDelta: 0, isDefault: true },
    { name: 'Level 2', priceDelta: 0 },
    { name: 'Level 3', priceDelta: 0 },
    { name: 'Level 4', priceDelta: 0 },
  ],
};

const PORSI: GroupTemplate = {
  name: 'Porsi',
  type: 'SINGLE',
  isRequired: true,
  maxSelect: null,
  options: [
    { name: 'Biasa', priceDelta: 0, isDefault: true },
    { name: 'Jumbo', priceDelta: 5000 },
  ],
};

const TOPPING: GroupTemplate = {
  name: 'Topping',
  type: 'MULTIPLE',
  isRequired: false,
  maxSelect: 3,
  options: [
    { name: 'Telur', priceDelta: 3000 },
    { name: 'Ceker', priceDelta: 4000 },
    { name: 'Sosis', priceDelta: 3000 },
    { name: 'Kerupuk', priceDelta: 2000 },
    { name: 'Bakso Tambahan', priceDelta: 4000 },
  ],
};

const TINGKAT_MANIS: GroupTemplate = {
  name: 'Tingkat Manis',
  type: 'SINGLE',
  isRequired: true,
  maxSelect: null,
  options: [
    { name: 'Normal', priceDelta: 0, isDefault: true },
    { name: 'Kurang Manis', priceDelta: 0 },
    { name: 'Tanpa Gula', priceDelta: 0 },
  ],
};

const CATEGORIES = [
  { slug: 'bakso', name: 'Bakso', icon: 'bakso' },
  { slug: 'mie-ayam', name: 'Mie Ayam', icon: 'mie-ayam' },
  { slug: 'seblak', name: 'Seblak', icon: 'seblak' },
  { slug: 'jajanan', name: 'Jajanan', icon: 'jajanan' },
  { slug: 'minuman', name: 'Minuman', icon: 'minuman' },
] as const;

type CategorySlug = (typeof CATEGORIES)[number]['slug'];

interface MenuSeed {
  category: CategorySlug;
  name: string;
  price: number;
  description: string;
  groups: GroupTemplate[];
  favorite?: boolean;
  recommended?: boolean;
}

const FOOD: MenuSeed[] = [
  { category: 'bakso', name: 'Bakso Urat', price: 15000, groups: [PORSI, TOPPING], favorite: true, recommended: true,
    description: 'Bakso urat kenyal dengan kuah kaldu sapi gurih, mie, dan taburan bawang goreng.' },
  { category: 'bakso', name: 'Bakso Halus', price: 13000, groups: [PORSI, TOPPING],
    description: 'Bakso daging halus dan lembut dengan kuah bening hangat, cocok untuk anak-anak.' },
  { category: 'bakso', name: 'Bakso Telur', price: 16000, groups: [PORSI, TOPPING],
    description: 'Bakso besar isi telur ayam utuh, disajikan dengan kuah kaldu dan sayur.' },
  { category: 'bakso', name: 'Bakso Mercon', price: 17000, groups: [LEVEL_PEDAS, PORSI], favorite: true,
    description: 'Bakso isi sambal rawit yang pedasnya meledak, buat yang suka tantangan.' },
  { category: 'mie-ayam', name: 'Mie Ayam Biasa', price: 12000, groups: [LEVEL_PEDAS, PORSI, TOPPING], favorite: true,
    description: 'Mie kuning kenyal dengan ayam kecap manis gurih dan sawi segar.' },
  { category: 'mie-ayam', name: 'Mie Ayam Bakso', price: 16000, groups: [LEVEL_PEDAS, PORSI, TOPPING], recommended: true,
    description: 'Mie ayam lengkap dengan bakso sapi dan kuah kaldu terpisah.' },
  { category: 'mie-ayam', name: 'Mie Ayam Ceker', price: 15000, groups: [LEVEL_PEDAS, PORSI, TOPPING],
    description: 'Mie ayam dengan ceker empuk yang dimasak bumbu kecap sampai meresap.' },
  { category: 'mie-ayam', name: 'Mie Ayam Pangsit', price: 14000, groups: [LEVEL_PEDAS, PORSI, TOPPING],
    description: 'Mie ayam dengan pangsit goreng renyah, enak dicocol ke kuahnya.' },
  { category: 'seblak', name: 'Seblak Original', price: 12000, groups: [LEVEL_PEDAS, TOPPING],
    description: 'Kerupuk basah berkuah kencur pedas gurih khas Bandung.' },
  { category: 'seblak', name: 'Seblak Komplit', price: 18000, groups: [LEVEL_PEDAS, TOPPING], favorite: true, recommended: true,
    description: 'Seblak isi kerupuk, telur, sosis, bakso, dan makaroni. Dijamin kenyang!' },
  { category: 'seblak', name: 'Seblak Ceker', price: 16000, groups: [LEVEL_PEDAS, TOPPING],
    description: 'Seblak kuah kencur dengan ceker ayam empuk yang bumbunya meresap.' },
  { category: 'jajanan', name: 'Basreng Pedas', price: 10000, groups: [LEVEL_PEDAS], favorite: true,
    description: 'Bakso goreng iris renyah dengan bumbu pedas daun jeruk.' },
  { category: 'jajanan', name: 'Otak-otak Goreng', price: 10000, groups: [], recommended: true,
    description: 'Otak-otak ikan goreng hangat dengan saus kacang pedas manis.' },
  { category: 'jajanan', name: 'Cireng Bumbu Rujak', price: 8000, groups: [LEVEL_PEDAS],
    description: 'Cireng garing di luar, kenyal di dalam, dengan bumbu rujak.' },
  { category: 'jajanan', name: 'Tahu Bakso', price: 10000, groups: [],
    description: 'Tahu goreng isi adonan bakso, gurih dan pas buat camilan.' },
];

const drink = (name: string, price: number, description: string, sweet = true, favorite = false): MenuSeed => ({
  category: 'minuman',
  name,
  price,
  description,
  groups: sweet ? [TINGKAT_MANIS] : [],
  favorite,
});

const DRINKS: MenuSeed[] = [
  drink('Es Teh Manis', 4000, 'Teh melati seduh dengan es batu, segar dan manis.', true, true),
  drink('Teh Manis Hangat', 4000, 'Teh melati hangat, teman makan bakso yang pas.'),
  drink('Es Teh Tawar', 3000, 'Teh melati dingin tanpa gula.', false),
  drink('Es Jeruk', 6000, 'Perasan jeruk segar dengan es batu.'),
  drink('Jeruk Hangat', 6000, 'Perasan jeruk segar disajikan hangat.'),
  drink('Es Lemon Tea', 7000, 'Teh dingin dengan perasan lemon yang segar.'),
  drink('Es Teh Susu', 7000, 'Teh dingin dengan susu kental manis yang creamy.'),
  drink('Kopi Hitam', 5000, 'Kopi tubruk hangat, wangi dan nendang.'),
  drink('Es Kopi Susu', 10000, 'Kopi susu dingin dengan gula aren.'),
  drink('Es Cappuccino', 8000, 'Cappuccino dingin yang lembut dan creamy.'),
  drink('Es Milo', 8000, 'Milo cokelat dingin kesukaan semua umur.'),
  drink('Es Susu Coklat', 8000, 'Susu cokelat dingin yang manis dan lembut.'),
  drink('Es Cincau', 7000, 'Cincau hitam dengan santan dan gula merah.'),
  drink('Es Timun Serut', 8000, 'Timun serut dengan selasih dan sirup, super segar.'),
  drink('Es Campur', 12000, 'Campuran buah, kolang-kaling, cincau, dan susu.'),
  drink('Es Buah', 12000, 'Potongan buah segar dengan sirup dan susu.'),
  drink('Es Kelapa Muda', 10000, 'Air dan daging kelapa muda dengan es batu.'),
  drink('Jus Alpukat', 12000, 'Jus alpukat kental dengan susu cokelat.'),
  drink('Jus Mangga', 10000, 'Jus mangga harum manis yang segar.'),
  drink('Air Mineral', 4000, 'Air mineral botol dingin.', false),
];

const BANNERS = [
  { title: 'Gratis Ongkir Tanpa Minimal', imageUrl: '/placeholders/banner-gratis-ongkir.svg', target: null },
  { title: 'Seblak Level 4 Berani Coba?', imageUrl: '/placeholders/banner-seblak-level-4.svg', target: 'seblak' },
  { title: 'Paket Bakso + Es Teh', imageUrl: '/placeholders/banner-paket-bakso.svg', target: 'bakso' },
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedAdmin() {
  const username = process.env.ADMIN_SEED_USERNAME?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!username || !password) {
    throw new Error('ADMIN_SEED_USERNAME dan ADMIN_SEED_PASSWORD wajib diisi di apps/api/.env');
  }
  if (password.length < 10) throw new Error('ADMIN_SEED_PASSWORD minimal 10 karakter');

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    console.log(`• Akun admin "${username}" sudah ada, dilewati.`);
    return;
  }
  await prisma.adminUser.create({
    data: { username, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`✓ Akun admin "${username}" dibuat.`);
}

async function seedStore() {
  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Warung Teras Rumah', address: 'Alamat warung (ubah di Pengaturan)' },
  });
  for (let day = 0; day <= 6; day++) {
    await prisma.operatingHour.upsert({
      where: { dayOfWeek: day },
      update: {},
      create: { dayOfWeek: day, isOpen: true, openTime: '10:00', closeTime: '21:00' },
    });
  }
  console.log('✓ Profil warung & jam buka (10.00–21.00 WIB setiap hari).');
}

async function seedCategories(): Promise<Map<CategorySlug, string>> {
  const ids = new Map<CategorySlug, string>();
  for (const [index, category] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: { ...category, sortOrder: index },
    });
    ids.set(category.slug, row.id);
  }
  console.log(`✓ ${CATEGORIES.length} kategori.`);
  return ids;
}

async function seedMenu(categoryIds: Map<CategorySlug, string>) {
  let created = 0;
  const sortByCategory = new Map<CategorySlug, number>();

  for (const item of [...FOOD, ...DRINKS]) {
    const sortOrder = sortByCategory.get(item.category) ?? 0;
    sortByCategory.set(item.category, sortOrder + 1);

    const slug = slugify(item.name);
    if (await prisma.menuItem.findUnique({ where: { slug } })) continue;

    const categoryId = categoryIds.get(item.category);
    if (!categoryId) throw new Error(`Kategori ${item.category} tidak ditemukan`);

    await prisma.menuItem.create({
      data: {
        categoryId,
        name: item.name,
        slug,
        description: item.description,
        basePrice: item.price,
        isFavorite: item.favorite ?? false,
        isRecommended: item.recommended ?? false,
        sortOrder,
        optionGroups: {
          create: item.groups.map((group, groupIndex) => ({
            name: group.name,
            type: group.type,
            isRequired: group.isRequired,
            maxSelect: group.maxSelect,
            sortOrder: groupIndex,
            options: {
              create: group.options.map((option, optionIndex) => ({
                name: option.name,
                priceDelta: option.priceDelta,
                isDefault: option.isDefault ?? false,
                sortOrder: optionIndex,
              })),
            },
          })),
        },
      },
    });
    created++;
  }
  console.log(`✓ Menu: ${created} dibuat, ${FOOD.length + DRINKS.length - created} sudah ada.`);
}

async function seedBanners(categoryIds: Map<CategorySlug, string>) {
  if ((await prisma.banner.count()) > 0) {
    console.log('• Banner sudah ada, dilewati.');
    return;
  }
  await prisma.banner.createMany({
    data: BANNERS.map((banner, index) => ({
      title: banner.title,
      imageUrl: banner.imageUrl,
      targetType: banner.target ? ('CATEGORY' as const) : ('NONE' as const),
      targetId: banner.target ? (categoryIds.get(banner.target) ?? null) : null,
      sortOrder: index,
    })),
  });
  console.log(`✓ ${BANNERS.length} banner dummy.`);
}

async function main() {
  await seedAdmin();
  await seedStore();
  const categoryIds = await seedCategories();
  await seedMenu(categoryIds);
  await seedBanners(categoryIds);
}

main()
  .catch((error: unknown) => {
    console.error('✗ Seed gagal:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
