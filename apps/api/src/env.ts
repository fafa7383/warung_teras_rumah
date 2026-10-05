import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const stringWithDefault = (fallback: string) =>
  z.preprocess(emptyToUndefined, z.string().min(1).default(fallback));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.url()).min(1)),
  COOKIE_DOMAIN: optionalString,

  DATABASE_URL: z.url(),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter acak'),

  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STORAGE_PUBLIC_BUCKET: stringWithDefault('public-assets'),
  STORAGE_PRIVATE_BUCKET: stringWithDefault('payment-proofs'),

  TURNSTILE_SECRET_KEY: z.string().min(1),

  VAPID_PUBLIC_KEY: z.string().min(1),
  VAPID_PRIVATE_KEY: z.string().min(1),
  VAPID_SUBJECT: z
    .string()
    .regex(/^(mailto:|https:\/\/)/, 'VAPID_SUBJECT harus diawali mailto: atau https://'),

  WA_GATEWAY_TOKEN: optionalString,
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(`✗ Environment variable di apps/api/.env belum benar:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
