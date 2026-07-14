import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@doc-viewer/core': resolve(import.meta.dirname, '../../packages/core/src/index.ts')
    }
  },
  test: {
    name: 'server',
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
