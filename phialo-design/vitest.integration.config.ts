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
    environment: 'node',
    include: ['**/src/**/*.integration.test.{js,jsx,ts,tsx}', '**/tests/integration/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});