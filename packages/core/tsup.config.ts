import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Footprint',
    outDir: 'dist',
    sourcemap: true,
    treeshake: true,
    splitting: false,
    minify: true,
  },
]);
