import {
  SUCCESSFUL_ORDER_STATUSES,
  type AdminMenuItemDto,
  type BannerDto,
  type CategoryDto,
  type HomeResponse,
  type MenuItemDto,
  type MenuResponse,
  type PricingMenuItem,
} from '@wtr/shared';
import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

export const menuItemInclude = {
  category: { select: { slug: true } },
  optionGroups: {
    orderBy: { sortOrder: 'asc' },
    include: { options: { orderBy: { sortOrder: 'asc' } } },
  },
} satisfies Prisma.MenuItemInclude;

export type MenuItemRow = Prisma.MenuItemGetPayload<{ include: typeof menuItemInclude }>;

const BEST_SELLER_LIMIT = 6;
const RECOMMENDED_LIMIT = 4;
const DRINKS_LIMIT = 8;
const DRINKS_CATEGORY_SLUG = 'minuman';

export function toMenuItemDto(
  row: MenuItemRow,
  bestSellerIds: ReadonlySet<string>,
  { includeInactive = false } = {},
): MenuItemDto {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categorySlug: row.category.slug,
    name: row.name,
    slug: row.slug,
    description: row.description,
    basePrice: row.basePrice,
    imageUrl: row.imageUrl,
    isAvailable: row.isAvailable,
    isBestSeller: bestSellerIds.has(row.id),
    isSpicy: row.optionGroups.some((group) => /pedas/i.test(group.name)),
    optionGroups: row.optionGroups
      .map((group) => ({
        id: group.id,
        name: group.name,
        type: group.type,
        isRequired: group.isRequired,
        maxSelect: group.maxSelect,
        options: group.options
          .filter((option) => includeInactive || option.isActive)
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceDelta: option.priceDelta,
            isDefault: option.isDefault,
            isActive: option.isActive,
          })),
      }))
      .filter((group) => includeInactive || group.options.length > 0),
  };
}

export function toAdminMenuItemDto(row: MenuItemRow, bestSellerIds: ReadonlySet<string>): AdminMenuItemDto {
  return {
    ...toMenuItemDto(row, bestSellerIds, { includeInactive: true }),
    isFavorite: row.isFavorite,
    isRecommended: row.isRecommended,
    sortOrder: row.sortOrder,
  };
}

/** Bentuk yang dipakai fungsi hitung harga di @wtr/shared. */
export function toPricingMenuItem(row: MenuItemRow): PricingMenuItem {
  return toMenuItemDto(row, new Set());
}

/** Menu terlaris 30 hari; bila data penjualan belum cukup, diisi menu bertanda Favorit (PRD 6.1). */
export async function getBestSellerIds(limit = BEST_SELLER_LIMIT): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const grouped = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: { status: { in: [...SUCCESSFUL_ORDER_STATUSES] }, createdAt: { gte: since } },
      menuItem: { deletedAt: null, category: { isActive: true } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });
  const ids = grouped.map((row) => row.menuItemId);

  if (ids.length < limit) {
    const favorites = await prisma.menuItem.findMany({
      where: { isFavorite: true, deletedAt: null, id: { notIn: ids }, category: { isActive: true } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      take: limit - ids.length,
      select: { id: true },
    });
    ids.push(...favorites.map((row) => row.id));
  }
  return ids;
}

function toCategoryDto(category: { id: string; name: string; slug: string; icon: string; sortOrder: number }): CategoryDto {
  return { id: category.id, name: category.name, slug: category.slug, icon: category.icon, sortOrder: category.sortOrder };
}

async function getActiveCategories() {
  return prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
}

async function getPublicMenuRows() {
  return prisma.menuItem.findMany({
    where: { deletedAt: null, category: { isActive: true } },
    include: menuItemInclude,
    orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
  });
}

export async function getPublicMenu(): Promise<MenuResponse> {
  const [categories, rows, bestSellerIds] = await Promise.all([
    getActiveCategories(),
    getPublicMenuRows(),
    getBestSellerIds(),
  ]);
  const bestSellers = new Set(bestSellerIds);
  return {
    categories: categories.map(toCategoryDto),
    items: rows.map((row) => toMenuItemDto(row, bestSellers)),
  };
}

export async function getHome(): Promise<HomeResponse> {
  const [categories, rows, bestSellerIds, banners] = await Promise.all([
    getActiveCategories(),
    getPublicMenuRows(),
    getBestSellerIds(),
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 5 }),
  ]);
  const bestSellers = new Set(bestSellerIds);
  const items = rows.map((row) => toMenuItemDto(row, bestSellers));
  const byId = new Map(items.map((item) => [item.id, item]));
  const availableFirst = (a: MenuItemDto, b: MenuItemDto) => Number(b.isAvailable) - Number(a.isAvailable);

  const categorySlugById = new Map(categories.map((c) => [c.id, c.slug]));
  const bannerDtos: BannerDto[] = banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    imageUrl: banner.imageUrl,
    targetType: banner.targetType,
    targetSlug:
      banner.targetType === 'CATEGORY' && banner.targetId
        ? (categorySlugById.get(banner.targetId) ?? null)
        : banner.targetType === 'MENU' && banner.targetId
          ? (byId.get(banner.targetId)?.slug ?? null)
          : null,
  }));

  return {
    categories: categories.map(toCategoryDto),
    banners: bannerDtos,
    bestSellers: bestSellerIds.flatMap((id) => byId.get(id) ?? []),
    recommended: rows
      .filter((row) => row.isRecommended)
      .slice(0, RECOMMENDED_LIMIT)
      .flatMap((row) => byId.get(row.id) ?? []),
    drinks: items
      .filter((item) => item.categorySlug === DRINKS_CATEGORY_SLUG)
      .sort(availableFirst)
      .slice(0, DRINKS_LIMIT),
  };
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'menu'
  );
}

/** Slug unik untuk menu baru; soft-deleted juga dihitung karena kolom slug unik. */
export async function uniqueMenuSlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let suffix = 1; ; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const exists = await prisma.menuItem.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
}

export async function uniqueCategorySlug(name: string): Promise<string> {
  const base = slugify(name);
  for (let suffix = 1; ; suffix++) {
    const candidate = suffix === 1 ? base : `${base}-${suffix}`;
    const exists = await prisma.category.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) return candidate;
  }
}
