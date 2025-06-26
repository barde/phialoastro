// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import { visualizer } from 'rollup-plugin-visualizer';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We apply our own base styles
    })
  ],
  // SEO and performance optimizations
  site: 'https://phialo.de',
  
  // Internationalization configuration
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    routing: {
      prefixDefaultLocale: false, // German URLs without /de prefix
      fallbackType: 'redirect'
    }
  },
  
  
  // Build configuration
  build: {
    inlineStylesheets: 'auto',
  },
  
  // Image optimization
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  
  // Prefetch configuration
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  
  // Dev server configuration
  server: {
    port: 4321,
    host: true,
  },
  
  // Vite configuration for bundle analysis
  vite: {
    plugins: [
      visualizer({
        emitFile: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ],
    resolve: {
      alias: {
        '@features': new URL('./src/features', import.meta.url).pathname,
        '@shared': new URL('./src/shared', import.meta.url).pathname,
        '@lib': new URL('./src/lib', import.meta.url).pathname,
        '@components': new URL('./src/shared/components', import.meta.url).pathname,
        '@layouts': new URL('./src/shared/layouts', import.meta.url).pathname,
        '@pages': new URL('./src/pages', import.meta.url).pathname,
        '@content': new URL('./src/content', import.meta.url).pathname,
        '@styles': new URL('./src/styles', import.meta.url).pathname,
        '@test': new URL('./src/test', import.meta.url).pathname
      }
    }
  }
});