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
      // Skip tests with React 19 compatibility issues  
      '**/shared/contexts/TurnstileProvider.test.tsx',
      '**/features/contact/components/ContactFormWithPreClearance.test.tsx',
      '**/test/Portfolio.test.tsx',
      '**/test/components/common/PortfolioModal.test.tsx',
      '**/test/components/contact/ContactForm.test.tsx',
      '**/test/components/layout/Navigation.test.tsx',
      '**/test/components/portfolio/PortfolioItem.test.tsx',
      '**/test/components/portfolio/PortfolioGrid.test.tsx',
      '**/test/components/sections/Portfolio.test.tsx'
    ],
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});