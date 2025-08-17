import { WorkerContext, RouteHandler } from '../types/worker';
import { logger } from '../utils/logger';

/**
 * Parse cache control header for max-age and stale-while-revalidate values
 */
function parseCacheControl(cacheControl: string | null): {
  maxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
} {
  if (!cacheControl) return {};
  
  const result: { maxAge?: number; staleWhileRevalidate?: number; mustRevalidate?: boolean } = {};
  
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  if (maxAgeMatch) {
    result.maxAge = parseInt(maxAgeMatch[1], 10);
  }
  
  const swrMatch = cacheControl.match(/stale-while-revalidate=(\d+)/);
  if (swrMatch) {
    result.staleWhileRevalidate = parseInt(swrMatch[1], 10);
  }
  
  if (cacheControl.includes('must-revalidate')) {
    result.mustRevalidate = true;
  }
  
  return result;
}

/**
 * Check if a cached response is stale based on age and cache control
 */
function isStale(response: Response): { isStale: boolean; inSWRWindow: boolean } {
  const age = parseInt(response.headers.get('Age') || '0', 10);
  const cacheControl = response.headers.get('Cache-Control');
  const { maxAge = 0, staleWhileRevalidate = 0 } = parseCacheControl(cacheControl);
  
  const isStale = age >= maxAge;
  const inSWRWindow = isStale && age < maxAge + staleWhileRevalidate;
  
  return { isStale, inSWRWindow };
}

/**
 * Cache middleware - wraps handlers to provide edge caching with stale-while-revalidate support
 */
export function withCache(handler: RouteHandler): RouteHandler {
  return async (context: WorkerContext): Promise<Response> => {
    const { request, ctx } = context;
    const cache = (caches as any).default;
    
    // Create cache key
    const cacheKey = new Request(request.url, request);
    
    // Try to get from cache
    let cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      const { isStale: isResponseStale, inSWRWindow } = isStale(cachedResponse);
      
      if (!isResponseStale) {
        // Fresh cache hit
        const headers = new Headers(cachedResponse.headers);
        headers.set('CF-Cache-Status', 'HIT');
        headers.set('X-Cache-State', 'fresh');
        
        logger.debug('Cache hit (fresh)', {
          url: request.url,
          cacheStatus: 'HIT',
          state: 'fresh',
        });
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers,
        });
      } else if (inSWRWindow) {
        // Stale but within SWR window - serve stale and revalidate in background
        const headers = new Headers(cachedResponse.headers);
        headers.set('CF-Cache-Status', 'HIT');
        headers.set('X-Cache-State', 'stale');
        headers.set('X-Cache-Revalidate', 'true');
        
        // Trigger background revalidation
        ctx.waitUntil(
          (async () => {
            try {
              const freshResponse = await handler(context);
              
              if (freshResponse.status === 200) {
                // Update cache with fresh response
                const cacheHeaders = new Headers(freshResponse.headers);
                cacheHeaders.set('Age', '0');
                cacheHeaders.set('X-Cache-Revalidated-At', new Date().toISOString());
                
                const newCachedResponse = new Response(freshResponse.body, {
                  status: freshResponse.status,
                  statusText: freshResponse.statusText,
                  headers: cacheHeaders,
                });
                
                await cache.put(cacheKey, newCachedResponse);
                
                logger.debug('Cache revalidated', {
                  url: request.url,
                  status: 'revalidated',
                });
              }
            } catch (error) {
              logger.error('Failed to revalidate cache', {
                url: request.url,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          })()
        );
        
        logger.debug('Cache hit (stale, revalidating)', {
          url: request.url,
          cacheStatus: 'HIT',
          state: 'stale',
          revalidating: true,
        });
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers,
        });
      }
      // If stale and outside SWR window, treat as cache miss
    }
    
    // Cache miss or expired - execute handler
    const response = await handler(context);
    
    // Only cache successful responses
    if (response.status === 200) {
      const headers = new Headers(response.headers);
      headers.set('CF-Cache-Status', cachedResponse ? 'EXPIRED' : 'MISS');
      headers.set('Age', '0');
      headers.set('X-Cache-Stored-At', new Date().toISOString());
      
      const cachedResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
      // Store in cache asynchronously
      ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
      
      logger.debug('Cache miss - storing response', {
        url: request.url,
        cacheStatus: headers.get('CF-Cache-Status'),
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