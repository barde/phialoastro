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
    },
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
              // Core React libraries
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              // Animation libraries
              if (id.includes('framer-motion')) {
                return 'motion-vendor';
              }
              // Icon libraries - defer loading
              if (id.includes('lucide-react')) {
                return 'icons-vendor';
              }
              // Form/Contact related libraries
              if (id.includes('@cloudflare/turnstile')) {
                return 'turnstile-vendor';
              }
              // All other vendor code
              return 'vendor';
            }
            
            // Split feature-based chunks
            if (id.includes('src/features/portfolio')) {
              return 'portfolio-feature';
            }
            if (id.includes('src/features/contact')) {
              return 'contact-feature';
            }
            if (id.includes('src/features/about')) {
              return 'about-feature';
            }
            if (id.includes('src/shared/navigation')) {
              return 'navigation';
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
});