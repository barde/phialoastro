/**
 * Worker configuration
 */

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
} as const;

/**
 * API-specific security headers
 */
export const API_SECURITY_HEADERS = {
  ...SECURITY_HEADERS,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-API-Version': '1.0.1',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
} as const;

/**
 * Content Security Policy configuration
 */
export const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: blob:",
  "media-src 'self' https:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
];

/**
 * Cache configuration by file type
 */
export const CACHE_CONFIG = {
  // Immutable assets (versioned files)
  immutable: {
    patterns: /\.(js|css|woff2?|ttf|otf|eot)$/,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  // Images
  images: {
    patterns: /\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/,
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  },
  // HTML and dynamic content
  html: {
    patterns: /\.html$/,
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  },
  // Default cache for other assets
  default: {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  },
} as const;

/**
 * Route configuration
 */
export const ROUTES = {
  // Static asset patterns that should bypass routing
  staticAssets: /\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|otf|eot|pdf|txt|xml|json)$/i,
  // API routes (if any)
  api: /^\/api\//,
} as const;

/**
 * Error page paths
 */
export const ERROR_PAGES = {
  404: '/404.html',
  500: '/500.html',
} as const;

/**
 * Request limits and timeouts
 */
export const LIMITS = {
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  requestTimeout: 30 * 1000, // 30 seconds
  cacheTimeout: 60 * 1000, // 60 seconds
} as const;

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(env: { ENVIRONMENT?: string } | string = 'production') {
  const environment = typeof env === 'string' ? env : (env.ENVIRONMENT || 'production');
  const isProduction = environment === 'production';
  
  return {
    debug: !isProduction,
    logLevel: isProduction ? 'INFO' : 'DEBUG',
    enableCache: isProduction,
    enableCompression: isProduction,
    enableMetrics: isProduction,
  };
}

/**
 * MIME type mappings
 */
export const MIME_TYPES: Record<string, string> = {
  // Text
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  
  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  
  // Documents
  '.pdf': 'application/pdf',
  
  // Media
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  
  // Archives
  '.zip': 'application/zip',
  '.gz': 'application/gzip',
  '.br': 'application/x-br',
  
  // Markdown
  '.md': 'text/markdown; charset=utf-8',
  
  // Default
  '': 'application/octet-stream',
};