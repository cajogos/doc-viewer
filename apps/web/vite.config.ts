/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Browser-safe subpath of core, bundled from source so dev and tests
      // do not depend on a prior core build.
      '@doc-viewer/core/themes': resolve(
        import.meta.dirname,
        '../../packages/core/src/export/themes.ts'
      ),
      '@doc-viewer/core': resolve(import.meta.dirname, '../../packages/core/src/index.ts')
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true
      }
    }
  },
  test: {
    name: 'web',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    globals: false
  }
});
