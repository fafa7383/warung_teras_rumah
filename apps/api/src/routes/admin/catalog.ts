import {
  MAX_ACTIVE_BANNERS,
  bannerInputSchema,
  categoryInputSchema,
  reorderSchema,
  type AdminBannerDto,
} from '@wtr/shared';
import { Router } from 'express';
import { HttpError } from '../../lib/http-error';
import { uuidParam } from '../../lib/params';
import { prisma } from '../../lib/prisma';
import { uniqueCategorySlug } from '../../services/menu';

// Kategori & banner (PRD 8.6, A-11).
export const categoriesRouter = Router();
export const bannersRouter = Router();

categoriesRouter.get('/', async (_req, res) => {
  const [categories, counts] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.menuItem.groupBy({ by: ['categoryId'], where: { deletedAt: null }, _count: { _all: true } }),
  ]);
  const countByCategory = new Map(counts.map((row) => [row.categoryId, row._count._all]));
  res.json(
    categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      itemCount: countByCategory.get(category.id) ?? 0,
    })),
  );
});

categoriesRouter.patch('/reorder', async (req, res) => {
  const { ids } = reorderSchema.parse(req.body);
  await prisma.$transaction(
    ids.map((id, index) => prisma.category.updateMany({ where: { id }, data: { sortOrder: index } })),
  );
  res.status(204).end();
});

categoriesRouter.post('/', async (req, res) => {
  const input = categoryInputSchema.parse(req.body);
  const last = await prisma.category.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.category.create({
    data: { ...input, slug: await uniqueCategorySlug(input.name), sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
  res.status(201).json({ ...category, itemCount: 0 });
});

categoriesRouter.patch('/:id', async (req, res) => {
  const id = uuidParam(req.params.id);
  const input = categoryInputSchema.parse(req.body);
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan');
  res.json(await prisma.category.update({ where: { id }, data: input }));
});

categoriesRouter.delete('/:id', async (req, res) => {
  const id = uuidParam(req.params.id);
  const items = await prisma.menuItem.count({ where: { categoryId: id, deletedAt: null } });
  if (items > 0) {
    throw new HttpError(409, 'CATEGORY_NOT_EMPTY', 'Masih ada menu di kategori ini. Pindahkan atau sembunyikan saja.');
  }
  const deletedItems = await prisma.menuItem.count({ where: { categoryId: id } });
  if (deletedItems > 0) {
    // Menu terhapus (soft delete) masih menunjuk kategori ini untuk laporan lama.
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.category.deleteMany({ where: { id } });
  }
  res.status(204).end();
});

function toBannerDto(banner: AdminBannerDto): AdminBannerDto {
  const { id, title, imageUrl, targetType, targetId, isActive, sortOrder } = banner;
  return { id, title, imageUrl, targetType, targetId, isActive, sortOrder };
}

async function assertBannerTarget(targetType: string, targetId: string | null) {
  if (targetType === 'CATEGORY' && targetId) {
    if (!(await prisma.category.findUnique({ where: { id: targetId } }))) {
      throw new HttpError(400, 'TARGET_NOT_FOUND', 'Kategori tujuan tidak ditemukan');
    }
  }
  if (targetType === 'MENU' && targetId) {
    if (!(await prisma.menuItem.findFirst({ where: { id: targetId, deletedAt: null } }))) {
      throw new HttpError(400, 'TARGET_NOT_FOUND', 'Menu tujuan tidak ditemukan');
    }
  }
}

async function assertActiveBannerLimit(excludeId?: string) {
  const active = await prisma.banner.count({ where: { isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) } });
  if (active >= MAX_ACTIVE_BANNERS) {
    throw new HttpError(409, 'BANNER_LIMIT', `Maksimal ${MAX_ACTIVE_BANNERS} banner aktif`);
  }
}

bannersRouter.get('/', async (_req, res) => {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json(banners.map(toBannerDto));
});

bannersRouter.patch('/reorder', async (req, res) => {
  const { ids } = reorderSchema.parse(req.body);
  await prisma.$transaction(
    ids.map((id, index) => prisma.banner.updateMany({ where: { id }, data: { sortOrder: index } })),
  );
  res.status(204).end();
});

bannersRouter.post('/', async (req, res) => {
  const input = bannerInputSchema.parse(req.body);
  const targetId = input.targetType === 'NONE' ? null : input.targetId;
  await assertBannerTarget(input.targetType, targetId);
  if (input.isActive) await assertActiveBannerLimit();
  const last = await prisma.banner.aggregate({ _max: { sortOrder: true } });
  const banner = await prisma.banner.create({
    data: { ...input, targetId, sortOrder: (last._max.sortOrder ?? -1) + 1 },
  });
  res.status(201).json(toBannerDto(banner));
});

bannersRouter.patch('/:id', async (req, res) => {
  const id = uuidParam(req.params.id);
  const input = bannerInputSchema.parse(req.body);
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'BANNER_NOT_FOUND', 'Banner tidak ditemukan');
  const targetId = input.targetType === 'NONE' ? null : input.targetId;
  await assertBannerTarget(input.targetType, targetId);
  if (input.isActive && !existing.isActive) await assertActiveBannerLimit(id);
  res.json(toBannerDto(await prisma.banner.update({ where: { id }, data: { ...input, targetId } })));
});

bannersRouter.delete('/:id', async (req, res) => {
  await prisma.banner.deleteMany({ where: { id: uuidParam(req.params.id) } });
  res.status(204).end();
});
