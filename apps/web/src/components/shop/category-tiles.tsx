import type { CategoryDto } from '@wtr/shared';
import Link from 'next/link';
import { FoodArt } from '@/components/brand/food-art';

/** Tombol kategori bulat berikon ilustrasi + label (PRD 6.1). */
export function CategoryTiles({ categories }: { categories: CategoryDto[] }) {
  if (categories.length === 0) return null;
  return (
    <nav aria-label="Kategori" className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:justify-start">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/menu?kategori=${category.slug}`}
          className="tap-scale flex w-[68px] shrink-0 flex-col items-center gap-1.5"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-surface shadow-card">
            <FoodArt kind={category.icon} size={50} />
          </span>
          <span className="w-full truncate text-center text-caption font-semibold text-label">{category.name}</span>
        </Link>
      ))}
    </nav>
  );
}
