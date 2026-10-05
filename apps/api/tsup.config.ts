import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // @wtr/shared diekspor sebagai source TypeScript, jadi ikut dibundel ke dist.
  noExternal: ['@wtr/shared'],
});
