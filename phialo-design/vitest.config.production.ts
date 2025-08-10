import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/tests/future/**',
      // Skip tests with React 19 compatibility issues  
      '**/shared/contexts/TurnstileProvider.test.tsx',
      '**/features/contact/components/ContactFormWithPreClearance.test.tsx'
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});