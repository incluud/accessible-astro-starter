import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname),
  test: {
    root: resolve(__dirname),
    include: ['src/**/*.test.ts'],
    environment: 'node',
    globals: true,
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
