import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()] as any,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**', '**/tests/future/**'],
    // Improve jsdom compatibility
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        pretendToBeVisual: true,
      },
    },
    // Additional test environment options
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
