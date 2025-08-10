import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/tests/future/**'],
    // Improve React 19 compatibility with jsdom
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
      },
    },
    // Additional options for React 19 compatibility
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
