import { WorkerContext, RouteHandler } from '../types/worker';
import { logger } from '../utils/logger';

/**
 * Cache middleware - wraps handlers to provide edge caching
 */
export function withCache(handler: RouteHandler): RouteHandler {
  return async (context: WorkerContext): Promise<Response> => {
    const { request, ctx } = context;
    const cache = (caches as any).default;
    
    // Create cache key
    const cacheKey = new Request(request.url, request);
    
    // Try to get from cache
    let response = await cache.match(cacheKey);
    
    if (response) {
      // Cache hit
      const headers = new Headers(response.headers);
      headers.set('CF-Cache-Status', 'HIT');
      
      logger.debug('Cache hit', {
        url: request.url,
        cacheStatus: 'HIT',
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    // Cache miss - execute handler
    response = await handler(context);
    
    // Only cache successful responses
    if (response.status === 200) {
      const headers = new Headers(response.headers);
      headers.set('CF-Cache-Status', 'MISS');
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
      // Store in cache asynchronously
      ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
      
      logger.debug('Cache miss - storing response', {
        url: request.url,
        cacheStatus: 'MISS',
      });
      
      return cachedResponse;
    }
    
    // Don't cache non-200 responses
    return response;
  };
}

/**
 * Purge cache for a specific URL or pattern
 */
export async function purgeCache(pattern: string | RegExp): Promise<number> {
  const cache = (caches as any).default;
  let purgedCount = 0;
  
  // Note: Cloudflare Workers doesn't support listing cache keys
  // This is a placeholder for when the API supports it
  logger.warn('Cache purge requested', { pattern: pattern.toString() });
  
  return purgedCount;
}

/**
 * Create cache key with custom options
 */
export function createCacheKey(request: Request, options?: {
  ignoreMethod?: boolean;
  ignoreSearch?: boolean;
  ignoreHeaders?: string[];
}): Request {
  const url = new URL(request.url);
  
  // Optionally ignore search params
  if (options?.ignoreSearch) {
    url.search = '';
  }
  
  // Create new request with normalized properties
  const cacheKeyRequest = new Request(url.toString(), {
    method: options?.ignoreMethod ? 'GET' : request.method,
    headers: request.headers,
  });
  
  // Remove ignored headers
  if (options?.ignoreHeaders) {
    const headers = new Headers(cacheKeyRequest.headers);
    options.ignoreHeaders.forEach(header => headers.delete(header));
    return new Request(cacheKeyRequest, { headers });
  }
  
  return cacheKeyRequest;
}