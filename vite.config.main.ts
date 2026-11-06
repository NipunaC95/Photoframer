import { defineConfig } from 'vite';
import path from 'path';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    target: 'node20',
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: {
        'main/main': path.resolve(__dirname, 'src/main/main.ts'),
        'main/imageProcessor': path.resolve(__dirname, 'src/main/imageProcessor.ts'),
        'preload/preload': path.resolve(__dirname, 'src/preload/preload.ts'),
      },
      formats: ['cjs'],
    },
    rollupOptions: {
      external: [
        'electron',
        'sharp',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        format: 'cjs',
      },
    },
    sourcemap: true,
  },
});
