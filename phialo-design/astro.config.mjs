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
    react(), // React for interactive components
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
      fallbackType: 'rewrite' // Use rewrite instead of redirect to avoid redirect chains
    }
  },
  
  
  // Build configuration
  build: {
    // Inline critical CSS automatically
    inlineStylesheets: 'auto',
    // Split content data to reduce bundle size
    assets: '_assets',
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
        // React and Preact removed - using Alpine.js for interactivity
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
      include: [
        'react', // Pre-bundle React since it's used across the site
        'react-dom/client', // Only client-side React DOM
      ],
      exclude: [
        // Exclude unused packages
        '@cloudflare/turnstile',
        'react-dom/server', // Exclude server-side rendering code
        'framer-motion' // Load framer-motion on-demand to reduce initial bundle
      ]
    },
    build: {
      // Optimize module preloading
      modulePreload: {
        polyfill: true,
      },
      // Enable tree shaking for better dead code elimination
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        preset: 'recommended',
        manualPureFunctions: ['console.log', 'console.warn', 'console.error']
      },
      // Optimize chunking to reduce dependency chains
      rollupOptions: {
        onwarn: (warning, warn) => {
          // Suppress unknown output options warnings
          if (warning.code === 'UNKNOWN_OPTION') return;
          warn(warning);
        },
        output: {
          manualChunks: (id) => {
            // Optimized chunk splitting to reduce dependency chains
            if (id.includes('node_modules')) {
              // Bundle React with vendor to reduce chains
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor';
              }
              
              // Split framer-motion into separate chunk for lazy loading
              if (id.includes('framer-motion')) {
                return 'animations';
              }
              
              // Web vitals and analytics - separate chunk for performance monitoring
              if (id.includes('web-vitals')) {
                return 'analytics';
              }
              
              // Utility libraries - keep small and bundle separately
              if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('lucide-react')) {
                return 'utils';
              }
              
              // All other vendor code
              return 'vendor';
            }
            
            // Bundle all React components together to reduce chains
            if (id.includes('.tsx')) {
              return 'react-components';
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
            if (id.includes('src/features/classes')) {
              return 'classes';
            }
            if (id.includes('src/features/legal')) {
              return 'legal';
            }
            
            // Split shared components by type
            if (id.includes('src/shared/navigation')) {
              return 'navigation';
            }
            if (id.includes('src/shared/components/ui')) {
              return 'ui-components';
            }
            if (id.includes('src/shared/components/effects')) {
              return 'effects';
            }
            if (id.includes('src/shared/components')) {
              return 'shared-components';
            }
            
            // Context providers
            if (id.includes('src/shared/contexts')) {
              return 'contexts';
            }
          },
          // Optimize chunk size and naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `_astro/[name].[hash].js`;
          },
          // Chunk size warnings moved to build.rollupOptions level
        },
      },
    },
  }
});// Performance Check v2 test comment
