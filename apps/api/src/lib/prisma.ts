import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '../env';
import { PrismaClient } from '../generated/prisma/client';

// Volume pesanan kecil; batasi koneksi agar kuota pooler Supabase gratis tidak habis.
export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DATABASE_URL, max: 5 }),
});
