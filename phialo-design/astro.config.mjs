// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import partytown from '@astrojs/partytown';
import { visualizer } from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
import { constants } from 'zlib';
// Script optimization will be handled differently

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false, // We apply our own base styles
    }),
    partytown({
      // Forward necessary functions to the web worker
      config: {
        forward: ['dataLayer.push'],
      },
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
    // Inline critical CSS automatically
    inlineStylesheets: 'auto',
  },
  
  // Image optimization with automatic format conversion
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
    resolve: {
      alias: [
        // Preact aliasing disabled due to Framer Motion incompatibility
        // TODO: Remove Framer Motion first, then enable Preact
        // ...(process.env.NODE_ENV === 'production' ? [
        //   { find: 'react', replacement: '@preact/compat' },
        //   { find: 'react-dom/test-utils', replacement: '@preact/compat/test-utils' },
        //   { find: 'react-dom', replacement: '@preact/compat' },
        //   { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }
        // ] : []),
        // Existing aliases
        { find: '@features', replacement: new URL('./src/features', import.meta.url).pathname },
        { find: '@shared', replacement: new URL('./src/shared', import.meta.url).pathname },
        { find: '@lib', replacement: new URL('./src/lib', import.meta.url).pathname },
        { find: '@components', replacement: new URL('./src/shared/components', import.meta.url).pathname },
        { find: '@layouts', replacement: new URL('./src/shared/layouts', import.meta.url).pathname },
        { find: '@pages', replacement: new URL('./src/pages', import.meta.url).pathname },
        { find: '@content', replacement: new URL('./src/content', import.meta.url).pathname },
        { find: '@styles', replacement: new URL('./src/styles', import.meta.url).pathname },
        { find: '@test', replacement: new URL('./src/test', import.meta.url).pathname }
      ]
    },
    plugins: [
      visualizer({
        emitFile: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      }),
      // Generate .gz files
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files larger than 1KB
        deleteOriginFile: false,
        filter: /\.(js|css|html|svg|json|xml|txt|wasm)$/i,
      }),
      // Generate .br files
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024, // Only compress files larger than 1KB
        deleteOriginFile: false,
        filter: /\.(js|css|html|svg|json|xml|txt|wasm)$/i,
        compressionOptions: {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: 11, // Maximum compression
          },
        },
      }),
    ],
    // Optimize dependency pre-bundling
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion'],
    },
    build: {
      // Optimize module preloading
      modulePreload: {
        polyfill: true,
      },
      // Optimize chunking to reduce dependency chains
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Bundle vendor libraries separately
            if (id.includes('node_modules')) {
              // Core React libraries - essential for hydration
              if (id.includes('react-dom')) {
                return 'react-dom';
              }
              if (id.includes('react')) {
                return 'react-core';
              }
              
              // Framer Motion - split into smaller chunks
              if (id.includes('framer-motion')) {
                // Check for specific framer-motion modules
                if (id.includes('dom-animation') || id.includes('dom-max')) {
                  return 'motion-features';
                }
                return 'motion-core';
              }
              
              // Icon libraries - lazy load when possible
              if (id.includes('lucide-react')) {
                return 'icons';
              }
              
              // Form/Contact related - load on demand
              if (id.includes('@cloudflare/turnstile')) {
                return 'turnstile';
              }
              
              // Utility libraries
              if (id.includes('clsx') || id.includes('tailwind-merge')) {
                return 'utils';
              }
              
              // All other smaller vendor code
              return 'vendor-misc';
            }
            
            // Split feature-based chunks for better code splitting
            if (id.includes('src/features/portfolio')) {
              return 'portfolio';
            }
            if (id.includes('src/features/contact')) {
              return 'contact';
            }
            if (id.includes('src/features/about')) {
              return 'about';
            }
            if (id.includes('src/features/services')) {
              return 'services';
            }
            if (id.includes('src/features/home')) {
              return 'home';
            }
            if (id.includes('src/shared/navigation')) {
              return 'navigation';
            }
            if (id.includes('src/shared/components')) {
              return 'shared-components';
            }
          },
          // Optimize chunk size
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `_astro/[name].[hash].js`;
          },
        },
      },
    },
  }
});// Performance Check v2 test comment
