import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // CLI (migrate, studio) memakai koneksi langsung/session pooler.
    // Runtime aplikasi memakai DATABASE_URL lewat driver adapter (src/lib/prisma.ts).
    // Tidak memakai env() agar `prisma generate` tetap jalan tanpa database (mis. saat build CI).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
});
