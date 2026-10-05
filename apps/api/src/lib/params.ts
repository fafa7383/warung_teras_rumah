import { z } from 'zod';
import { HttpError } from './http-error';

const uuid = z.uuid();

/** Parameter :id yang bukan UUID langsung 404, bukan error database. */
export function uuidParam(value: string): string {
  if (!uuid.safeParse(value).success) throw new HttpError(404, 'NOT_FOUND', 'Data tidak ditemukan');
  return value;
}
