import { daypartFromHour, getWibHour, type Daypart } from '@wtr/shared';

/** Hanya saat development: `/?jam=19.5` untuk melihat suasana Home di jam lain. */
export const DAYPART_PREVIEW_PARAM = 'jam';

let lastSearch: string | null = null;
let previewHour: number | null = null;

function readPreviewHour(): number | null {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return null;
  const search = window.location.search;
  if (search !== lastSearch) {
    lastSearch = search;
    const raw = new URLSearchParams(search).get(DAYPART_PREVIEW_PARAM)?.replace(',', '.');
    const value = raw ? Number(raw) : Number.NaN;
    previewHour = Number.isFinite(value) && value >= 0 && value < 24 ? value : null;
  }
  return previewHour;
}

/** Jam WIB berpecahan saat ini (17.5 = 17.30). */
export function currentWibHour(): number {
  return readPreviewHour() ?? getWibHour();
}

export function currentDaypart(): Daypart {
  return daypartFromHour(currentWibHour());
}
