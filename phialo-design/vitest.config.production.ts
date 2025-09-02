import { defineConfig } from 'vitest/config';
<<<<<<< HEAD
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()] as any,
=======

export default defineConfig({
  plugins: [],
>>>>>>> origin/master
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