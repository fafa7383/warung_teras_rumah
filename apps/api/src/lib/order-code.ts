import { createHmac, randomBytes, randomInt } from 'node:crypto';
import {
  ORDER_ACCESS_TOKEN_BYTES,
  ORDER_CODE_ALPHABET,
  ORDER_CODE_LENGTH,
  ORDER_CODE_PREFIX,
} from '@wtr/shared';
import { env } from '../env';

/** "WTR-" + 5 karakter tanpa 0, O, 1, I. */
export function generateOrderCode(): string {
  let suffix = '';
  for (let i = 0; i < ORDER_CODE_LENGTH; i++) {
    suffix += ORDER_CODE_ALPHABET[randomInt(ORDER_CODE_ALPHABET.length)];
  }
  return `${ORDER_CODE_PREFIX}${suffix}`;
}

/** 24 byte acak, base64url (32 karakter). Satu-satunya kunci untuk membuka detail pesanan. */
export function generateAccessToken(): string {
  return randomBytes(ORDER_ACCESS_TOKEN_BYTES).toString('base64url');
}

/** IP tidak disimpan mentah; cukup hash untuk melacak spam. */
export function hashIp(ip: string | undefined): string | null {
  return ip ? createHmac('sha256', env.JWT_SECRET).update(ip).digest('hex') : null;
}

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
