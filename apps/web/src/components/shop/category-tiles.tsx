import type { CategoryDto } from '@wtr/shared';
import Link from 'next/link';
import { FoodArt } from '@/components/brand/food-art';
import { riseOrder } from '@/lib/motion';

/** Tombol kategori bulat berikon ilustrasi + label (PRD 6.1), muncul berurutan. */
export function CategoryTiles({
  categories,
  riseFrom = 0,
}: {
  categories: CategoryDto[];
  riseFrom?: number;
}) {
  if (categories.length === 0) return null;
  return (
    <nav
      aria-label="Kategori"
      className="-mx-4 no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 sm:justify-start"
    >
      {categories.map((category, index) => (
        <Link
          key={category.id}
          href={`/menu?kategori=${category.slug}`}
          className="group flex w-[68px] shrink-0 animate-rise flex-col items-center gap-1.5"
          style={riseOrder(riseFrom + index)}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-surface shadow-card transition-transform duration-200 ease-out group-active:scale-90">
            <FoodArt kind={category.icon} size={50} />
          </span>
          <span className="w-full truncate text-center text-caption font-semibold text-label">
            {category.name}
          </span>
        </Link>
      ))}
    </nav>
  );
}
