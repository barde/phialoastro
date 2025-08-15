/**
 * Advanced Caching Handler for Cloudflare Workers
 * Implements asset-type-specific caching rules and stale-while-revalidate pattern
 */

import type { Context } from '../types/index';

// Cache durations by asset type (in seconds)
const CACHE_DURATIONS = {
  // Immutable assets (hashed filenames)
  immutable: 31536000, // 1 year
  
  // Images and media
  images: 2592000, // 30 days
  
  // CSS and JS (without hash)
  scripts: 86400, // 1 day
  styles: 86400, // 1 day
  
  // Fonts
  fonts: 31536000, // 1 year
  
  // HTML pages
  html: 3600, // 1 hour
  
  // API/JSON responses
  json: 300, // 5 minutes
  
  // Default for other assets
  default: 3600 // 1 hour
};

// Stale-while-revalidate durations (in seconds)
const SWR_DURATIONS = {
  html: 86400, // 1 day stale
  json: 3600, // 1 hour stale
  scripts: 604800, // 1 week stale
  styles: 604800, // 1 week stale
  default: 86400 // 1 day stale
};

/**
 * Determine asset type from URL and content type
 */
export function getAssetType(pathname: string, contentType: string | null): string {
  // Check for hashed/immutable assets (contain hash in filename)
  if (/\.[a-f0-9]{8,}\.(js|css|woff2?|ttf|otf|eot)$/i.test(pathname)) {
    return 'immutable';
  }
  
  // Check by file extension
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'avif':
    case 'svg':
    case 'ico':
      return 'images';
    
    case 'woff':
    case 'woff2':
    case 'ttf':
    case 'otf':
    case 'eot':
      return 'fonts';
    
    case 'js':
    case 'mjs':
      return 'scripts';
    
    case 'css':
      return 'styles';
    
    case 'html':
    case 'htm':
      return 'html';
    
    case 'json':
      return 'json';
    
    default:
      // Check content type as fallback
      if (contentType) {
        if (contentType.includes('image/')) return 'images';
        if (contentType.includes('font/')) return 'fonts';
        if (contentType.includes('javascript')) return 'scripts';
        if (contentType.includes('css')) return 'styles';
        if (contentType.includes('html')) return 'html';
        if (contentType.includes('json')) return 'json';
      }
      return 'default';
  }
}

/**
 * Generate cache control header based on asset type
 */
export function getCacheControlHeader(assetType: string, isPublic: boolean = true): string {
  const maxAge = CACHE_DURATIONS[assetType as keyof typeof CACHE_DURATIONS] || CACHE_DURATIONS.default;
  const swrDuration = SWR_DURATIONS[assetType as keyof typeof SWR_DURATIONS] || SWR_DURATIONS.default;
  
  const directives: string[] = [];
  
  // Public vs private
  directives.push(isPublic ? 'public' : 'private');
  
  // Max age
  directives.push(`max-age=${maxAge}`);
  
  // Immutable assets never change
  if (assetType === 'immutable') {
    directives.push('immutable');
  } else {
    // Add stale-while-revalidate for non-immutable assets
    directives.push(`stale-while-revalidate=${swrDuration}`);
  }
  
  // Must revalidate for HTML to ensure fresh content
  if (assetType === 'html') {
    directives.push('must-revalidate');
  }
  
  return directives.join(', ');
}

/**
 * Apply caching headers to response
 */
export function applyCachingHeaders(
  response: Response,
  pathname: string,
  options: {
    isPublic?: boolean;
    noCache?: boolean;
    customMaxAge?: number;
  } = {}
): Response {
  const headers = new Headers(response.headers);
  
  // No cache for specific scenarios
  if (options.noCache) {
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
  
  const contentType = response.headers.get('Content-Type');
  const assetType = getAssetType(pathname, contentType);
  
  // Generate cache control header
  const cacheControl = options.customMaxAge
    ? `${options.isPublic !== false ? 'public' : 'private'}, max-age=${options.customMaxAge}`
    : getCacheControlHeader(assetType, options.isPublic !== false);
  
  headers.set('Cache-Control', cacheControl);
  
  // Add ETag for conditional requests (if not already present)
  if (!headers.has('ETag') && response.body) {
    // Simple ETag based on content length and last modified
    const lastModified = headers.get('Last-Modified') || new Date().toUTCString();
    const contentLength = headers.get('Content-Length') || '0';
    const etag = `W/"${contentLength}-${Date.parse(lastModified)}"`;
    headers.set('ETag', etag);
  }
  
  // Set Vary header for proper caching with compression
  const currentVary = headers.get('Vary') || '';
  const varyValues = new Set(currentVary.split(',').map(v => v.trim()).filter(Boolean));
  varyValues.add('Accept-Encoding');
  
  // Add Accept for content negotiation
  if (assetType === 'images') {
    varyValues.add('Accept');
  }
  
  headers.set('Vary', Array.from(varyValues).join(', '));
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Handle conditional requests (If-None-Match, If-Modified-Since)
 */
export function handleConditionalRequest(
  request: Request,
  response: Response
): Response | null {
  const etag = response.headers.get('ETag');
  const lastModified = response.headers.get('Last-Modified');
  
  // Check If-None-Match
  const ifNoneMatch = request.headers.get('If-None-Match');
  if (ifNoneMatch && etag) {
    const tags = ifNoneMatch.split(',').map(t => t.trim());
    if (tags.includes(etag) || tags.includes('*')) {
      return new Response(null, {
        status: 304,
        statusText: 'Not Modified',
        headers: {
          'Cache-Control': response.headers.get('Cache-Control') || '',
          'ETag': etag
        }
      });
    }
  }
  
  // Check If-Modified-Since
  const ifModifiedSince = request.headers.get('If-Modified-Since');
  if (ifModifiedSince && lastModified) {
    const requestDate = new Date(ifModifiedSince).getTime();
    const responseDate = new Date(lastModified).getTime();
    
    if (responseDate <= requestDate) {
      return new Response(null, {
        status: 304,
        statusText: 'Not Modified',
        headers: {
          'Cache-Control': response.headers.get('Cache-Control') || '',
          'Last-Modified': lastModified
        }
      });
    }
  }
  
  return null;
}

/**
 * Caching middleware for Cloudflare Workers
 */
export async function cachingMiddleware(
  request: Request,
  context: Context,
  next: () => Promise<Response>
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Skip caching for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return next();
  }
  
  // Get response
  let response = await next();
  
  // Handle conditional requests
  const conditionalResponse = handleConditionalRequest(request, response);
  if (conditionalResponse) {
    return conditionalResponse;
  }
  
  // Apply caching headers
  const isError = response.status >= 400;
  const noCache = isError || pathname.includes('/api/') || pathname.includes('_astro');
  
  response = applyCachingHeaders(response, pathname, {
    noCache,
    isPublic: !pathname.includes('/admin') && !pathname.includes('/private')
  });
  
  return response;
}

/**
 * Custom stale-while-revalidate implementation using Cloudflare Workers
 * This simulates SWR behavior using KV storage and background fetch
 */
export class StaleWhileRevalidate {
  private kv: KVNamespace;
  private cacheName: string;
  
  constructor(kv: KVNamespace, cacheName: string = 'swr-cache') {
    this.kv = kv;
    this.cacheName = cacheName;
  }
  
  /**
   * Get cached response and optionally trigger background revalidation
   */
  async get(
    request: Request,
    fetcher: () => Promise<Response>,
    options: {
      maxAge: number;
      staleWhileRevalidate: number;
    }
  ): Promise<Response> {
    const cacheKey = this.getCacheKey(request);
    
    // Try to get from cache
    const cached = await this.kv.get(cacheKey, 'json') as CachedResponse | null;
    
    if (!cached) {
      // Cache miss - fetch and store
      const response = await fetcher();
      await this.put(cacheKey, response, options.maxAge + options.staleWhileRevalidate);
      return response;
    }
    
    const age = Date.now() - cached.timestamp;
    const maxAgeMs = options.maxAge * 1000;
    const staleMs = options.staleWhileRevalidate * 1000;
    
    if (age < maxAgeMs) {
      // Fresh - return from cache
      return this.buildResponse(cached);
    } else if (age < maxAgeMs + staleMs) {
      // Stale but within SWR window - return stale and revalidate in background
      const staleResponse = this.buildResponse(cached);
      
      // Trigger background revalidation
      this.revalidateInBackground(cacheKey, fetcher, options.maxAge + options.staleWhileRevalidate);
      
      return staleResponse;
    } else {
      // Too stale - fetch fresh
      const response = await fetcher();
      await this.put(cacheKey, response, options.maxAge + options.staleWhileRevalidate);
      return response;
    }
  }
  
  private getCacheKey(request: Request): string {
    return `${this.cacheName}:${request.url}`;
  }
  
  private async put(key: string, response: Response, ttl: number): Promise<void> {
    const cached: CachedResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.clone().text(),
      timestamp: Date.now()
    };
    
    await this.kv.put(key, JSON.stringify(cached), {
      expirationTtl: ttl
    });
  }
  
  private buildResponse(cached: CachedResponse): Response {
    return new Response(cached.body, {
      status: cached.status,
      statusText: cached.statusText,
      headers: cached.headers
    });
  }
  
  private revalidateInBackground(
    key: string,
    fetcher: () => Promise<Response>,
    ttl: number
  ): void {
    // Use waitUntil to perform background revalidation
    // This needs to be called within the request context
    fetcher().then(async response => {
      await this.put(key, response, ttl);
    }).catch(error => {
      console.error('Background revalidation failed:', error);
    });
  }
}

interface CachedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}