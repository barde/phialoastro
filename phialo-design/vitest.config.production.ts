import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/tests/future/**',
      // Skip disabled React test files  
      '**/*.test.tsx.disabled',
      '**/*.test.jsx.disabled'
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});