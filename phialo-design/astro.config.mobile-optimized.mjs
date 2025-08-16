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
  
  // Enhanced build configuration for mobile performance
  build: {
    // Inline critical CSS for faster FCP
    inlineStylesheets: 'auto',
    
    // Split CSS for better caching
    cssCodeSplit: true,
    
    // Compress output
    compress: true,
    
    // Format output for better debugging in production
    format: 'directory',
    
    // Assets handling
    assets: '_astro',
    assetsPrefix: process.env.CDN_URL || undefined,
  },
  
  // Enhanced image optimization for mobile
  image: {
    // Allow all HTTPS images for optimization
    remotePatterns: [{ protocol: 'https' }],
    
    // Service configuration for image optimization
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        limitInputPixels: 268402689, // Default Sharp limit
      }
    },
    
    // Responsive image configuration
    domains: ['phialo.de', 'cdn.phialo.de'],
    
    // Define breakpoints for responsive images
    breakpoints: [320, 640, 768, 1024, 1280, 1536, 1920],
    
    // Default layout for responsive images
    layout: 'constrained',
    
    // Default object fit
    objectFit: 'cover',
    
    // Default object position
    objectPosition: 'center',
    
    // Enable responsive styles
    responsiveStyles: true,
  },
  
  // Enhanced prefetch configuration for mobile
  prefetch: {
    // Prefetch visible links for instant navigation
    defaultStrategy: 'viewport',
    
    // Don't prefetch all links on mobile to save data
    prefetchAll: false,
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize CSS delivery
    optimizeHoistedScript: true,
    
    // Content collections cache for faster builds
    contentCollectionCache: true,
  },
  
  // Dev server configuration
  server: {
    port: 4321,
    host: true,
  },
  
  // Enhanced Vite configuration for mobile optimization
  vite: {
    plugins: [
      visualizer({
        emitFile: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ],
    
    // Build optimizations
    build: {
      // Enable CSS code splitting
      cssCodeSplit: true,
      
      // Optimize dependencies
      rollupOptions: {
        output: {
          // Manual chunks for better caching
          manualChunks: (id) => {
            // Separate vendor chunks
            if (id.includes('node_modules')) {
              // React and related libraries
              if (id.includes('react')) {
                return 'react-vendor';
              }
              // Framer Motion
              if (id.includes('framer-motion')) {
                return 'framer-motion';
              }
              // Other vendor libraries
              return 'vendor';
            }
            // Portfolio-specific code
            if (id.includes('/portfolio/')) {
              return 'portfolio';
            }
            // Shared components
            if (id.includes('/shared/')) {
              return 'shared';
            }
          },
          
          // Asset file naming for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            
            // Group assets by type
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp|avif)$/i.test(assetInfo.name)) {
              return `images/[name].[hash][extname]`;
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(assetInfo.name)) {
              return `fonts/[name].[hash][extname]`;
            }
            if (extType === 'css') {
              return `css/[name].[hash][extname]`;
            }
            return `[name].[hash][extname]`;
          },
          
          // Chunk file naming
          chunkFileNames: 'js/[name].[hash].js',
          
          // Entry file naming
          entryFileNames: 'js/[name].[hash].js',
        },
        
        // Tree-shaking optimizations
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      
      // Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
          ascii_only: true,
        },
      },
      
      // Chunk size warnings
      chunkSizeWarningLimit: 500,
      
      // Source maps for production debugging
      sourcemap: process.env.NODE_ENV !== 'production',
      
      // Target modern browsers for smaller bundles
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      
      // Report compressed size
      reportCompressedSize: true,
    },
    
    // CSS optimizations
    css: {
      postcss: {
        plugins: [
          // Add autoprefixer if needed
        ],
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables.scss";`,
        },
      },
    },
    
    // Performance optimizations
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion'],
      exclude: ['@astrojs/react'],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    
    // Resolve configuration
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
        '@test': new URL('./src/test', import.meta.url).pathname,
        '@assets': new URL('./src/assets', import.meta.url).pathname,
      }
    },
    
    // Server configuration for development
    server: {
      hmr: {
        overlay: true,
      },
      watch: {
        // Ignore files that don't need watching
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
    },
  },
  
  // Output configuration
  output: 'static',
  
  // Adapter configuration (if using SSR)
  // adapter: cloudflare(),
});