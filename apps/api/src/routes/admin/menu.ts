import {
  availabilitySchema,
  menuItemInputSchema,
  reorderSchema,
  type AdminMenuResponse,
} from '@wtr/shared';
import { Router } from 'express';
import type { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client';
import { HttpError } from '../../lib/http-error';
import { uuidParam } from '../../lib/params';
import { prisma } from '../../lib/prisma';
import {
  getBestSellerIds,
  menuItemInclude,
  toAdminMenuItemDto,
  uniqueMenuSlug,
} from '../../services/menu';

export const menuRouter = Router();

type MenuItemInput = z.output<typeof menuItemInputSchema>;
type OptionGroupInput = MenuItemInput['optionGroups'][number];

const TRANSACTION_OPTIONS = { timeout: 20_000 };

function itemData(input: MenuItemInput) {
  return {
    name: input.name,
    categoryId: input.categoryId,
    description: input.description || null,
    basePrice: input.basePrice,
    imageUrl: input.imageUrl,
    isAvailable: input.isAvailable,
    isFavorite: input.isFavorite,
    isRecommended: input.isRecommended,
  };
}

function groupData(group: OptionGroupInput, sortOrder: number) {
  return {
    name: group.name,
    type: group.type,
    isRequired: group.isRequired,
    maxSelect: group.type === 'MULTIPLE' ? group.maxSelect : null,
    sortOrder,
  };
}

function optionData(option: OptionGroupInput['options'][number], sortOrder: number) {
  return {
    name: option.name,
    priceDelta: option.priceDelta,
    isDefault: option.isDefault,
    isActive: option.isActive,
    sortOrder,
  };
}

/**
 * Sinkronkan grup opsi dengan mempertahankan id yang masih ada, supaya isi keranjang pembeli
 * yang memakai opsi lama tetap valid. Pesanan lama aman karena menyimpan snapshot.
 */
async function syncOptionGroups(tx: Prisma.TransactionClient, menuItemId: string, groups: OptionGroupInput[]) {
  const existing = await tx.optionGroup.findMany({ where: { menuItemId }, include: { options: true } });
  const existingById = new Map(existing.map((group) => [group.id, group]));
  const keptGroupIds = groups.flatMap((group) => (group.id && existingById.has(group.id) ? [group.id] : []));
  await tx.optionGroup.deleteMany({ where: { menuItemId, id: { notIn: keptGroupIds } } });

  for (const [groupIndex, group] of groups.entries()) {
    const current = group.id ? existingById.get(group.id) : undefined;
    if (!current) {
      await tx.optionGroup.create({
        data: {
          ...groupData(group, groupIndex),
          menuItemId,
          options: { create: group.options.map((option, index) => optionData(option, index)) },
        },
      });
      continue;
    }

    await tx.optionGroup.update({ where: { id: current.id }, data: groupData(group, groupIndex) });
    const currentOptionIds = new Set(current.options.map((option) => option.id));
    const keptOptionIds = group.options.flatMap((o) => (o.id && currentOptionIds.has(o.id) ? [o.id] : []));
    await tx.option.deleteMany({ where: { optionGroupId: current.id, id: { notIn: keptOptionIds } } });
    for (const [optionIndex, option] of group.options.entries()) {
      const data = optionData(option, optionIndex);
      if (option.id && currentOptionIds.has(option.id)) {
        await tx.option.update({ where: { id: option.id }, data });
      } else {
        await tx.option.create({ data: { ...data, optionGroupId: current.id } });
      }
    }
  }
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan');
}

async function findMenuItem(id: string) {
  const item = await prisma.menuItem.findFirst({ where: { id, deletedAt: null }, include: menuItemInclude });
  if (!item) throw new HttpError(404, 'MENU_NOT_FOUND', 'Menu tidak ditemukan');
  return item;
}

menuRouter.get('/', async (_req, res) => {
  const [categories, items, bestSellerIds, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.menuItem.findMany({
      where: { deletedAt: null },
      include: menuItemInclude,
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    }),
    getBestSellerIds(),
    prisma.menuItem.groupBy({ by: ['categoryId'], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  const countByCategory = new Map(counts.map((row) => [row.categoryId, row._count._all]));
  const bestSellers = new Set(bestSellerIds);
  const body: AdminMenuResponse = {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      itemCount: countByCategory.get(category.id) ?? 0,
    })),
    items: items.map((item) => toAdminMenuItemDto(item, bestSellers)),
  };
  res.json(body);
});

// Harus didaftarkan sebelum /:id agar "reorder" tidak dianggap id.
menuRouter.patch('/reorder', async (req, res) => {
  const { ids } = reorderSchema.parse(req.body);
  await prisma.$transaction(
    ids.map((id, index) => prisma.menuItem.updateMany({ where: { id }, data: { sortOrder: index } })),
  );
  res.status(204).end();
});

menuRouter.post('/', async (req, res) => {
  const input = menuItemInputSchema.parse(req.body);
  await assertCategoryExists(input.categoryId);
  const slug = await uniqueMenuSlug(input.name);
  const lastInCategory = await prisma.menuItem.aggregate({
    where: { categoryId: input.categoryId, deletedAt: null },
    _max: { sortOrder: true },
  });

  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.create({
      data: { ...itemData(input), slug, sortOrder: (lastInCategory._max.sortOrder ?? -1) + 1 },
    });
    await syncOptionGroups(tx, item.id, input.optionGroups);
    return item;
  }, TRANSACTION_OPTIONS);

  const bestSellers = new Set(await getBestSellerIds());
  res.status(201).json(toAdminMenuItemDto(await findMenuItem(created.id), bestSellers));
});

menuRouter.get('/:id', async (req, res) => {
  const item = await findMenuItem(uuidParam(req.params.id));
  res.json(toAdminMenuItemDto(item, new Set(await getBestSellerIds())));
});

menuRouter.patch('/:id', async (req, res) => {
  const id = uuidParam(req.params.id);
  const input = menuItemInputSchema.parse(req.body);
  await findMenuItem(id);
  await assertCategoryExists(input.categoryId);

  await prisma.$transaction(async (tx) => {
    // Slug tidak diubah saat ganti nama agar link yang sudah dibagikan tetap berlaku.
    await tx.menuItem.update({ where: { id }, data: itemData(input) });
    await syncOptionGroups(tx, id, input.optionGroups);
  }, TRANSACTION_OPTIONS);

  res.json(toAdminMenuItemDto(await findMenuItem(id), new Set(await getBestSellerIds())));
});

menuRouter.patch('/:id/availability', async (req, res) => {
  const id = uuidParam(req.params.id);
  const { isAvailable } = availabilitySchema.parse(req.body);
  await findMenuItem(id);
  await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  res.json({ id, isAvailable });
});

/** Soft delete agar laporan & pesanan lama tetap benar. */
menuRouter.delete('/:id', async (req, res) => {
  const id = uuidParam(req.params.id);
  await findMenuItem(id);
  await prisma.menuItem.update({
    where: { id },
    data: { deletedAt: new Date(), isAvailable: false, isFavorite: false, isRecommended: false },
  });
  res.status(204).end();
});
