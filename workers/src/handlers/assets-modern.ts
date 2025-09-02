import { WorkerContext, WorkerError, ErrorType, AssetHandlerOptions } from '../types/worker';
import { getMimeType } from '../utils/mime';
import { logger } from '../utils/logger';

/**
 * Maps request URLs to asset paths, handling directory index files
 */
export function mapRequestToAsset(request: Request): Request {
  const url = new URL(request.url);
  let pathname = url.pathname;
  
  // Default to index.html for directory requests
  if (pathname === '/') {
    pathname = '/index.html';
  } else if (pathname.endsWith('/')) {
    pathname = pathname + 'index.html';
  } else if (!pathname.includes('.')) {
    // Check if it's a directory by looking for index.html
    pathname = pathname + '/index.html';
  }
  
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

/**
 * Checks if the file should be served with compression
 */
function isCompressible(pathname: string): boolean {
  return /\.(js|css|html|svg|json|xml|txt|wasm)$/i.test(pathname);
}

/**
 * Get cache control headers based on file type
 */
export function getCacheHeaders(pathname: string): HeadersInit {
  const headers: HeadersInit = {};
  
  // Immutable assets with hash in filename (Astro generates these)
<<<<<<< HEAD
  if (pathname.match(/\/_(astro|assets)\/.*\.[a-zA-Z0-9_-]{8,}\.(js|css)$/)) {
=======
  if (pathname.match(/\/_astro\/.*\.[a-zA-Z0-9]{8,}\.(js|css)$/)) {
>>>>>>> origin/master
    // These are immutable - cache forever
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }
  // Regular JS/CSS without hash (might change)
  else if (pathname.match(/\.(js|css)$/)) {
    headers['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=604800';
  }
  // Font files - cache for a long time
  else if (pathname.match(/\.(woff2?|ttf|otf|eot)$/)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }
  // Images - cache with revalidation
  else if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/)) {
    headers['Cache-Control'] = 'public, max-age=2592000, stale-while-revalidate=604800'; // 30 days + 7 days stale
  }
  // HTML files - always revalidate
  else if (pathname.match(/\.html$/) || pathname === '/') {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
  }
  // Default for other assets
  else {
    headers['Cache-Control'] = 'public, max-age=3600, stale-while-revalidate=86400';
  }
  
  return headers;
}

/**
 * Fetches an asset using the modern ASSETS binding
 */
export async function fetchAsset(
  context: WorkerContext,
  options?: AssetHandlerOptions
): Promise<Response> {
  const { request, env } = context;
  
  // Map the request to the correct asset path
  const mappedRequest = options?.mapRequestToAsset ? 
    options.mapRequestToAsset(request) : 
    mapRequestToAsset(request);
  
  const url = new URL(mappedRequest.url);
  const pathname = url.pathname;
  const acceptEncoding = request.headers.get('Accept-Encoding') || '';
  
  // Try to serve pre-compressed assets if available and supported
  if (isCompressible(pathname)) {
    // Prefer Brotli over Gzip
    const compressionVariants = [];
    
    if (acceptEncoding.includes('br')) {
      compressionVariants.push({ ext: '.br', encoding: 'br' });
    }
    if (acceptEncoding.includes('gzip')) {
      compressionVariants.push({ ext: '.gz', encoding: 'gzip' });
    }
    
    // Try each compression variant
    for (const variant of compressionVariants) {
      const compressedUrl = new URL(mappedRequest.url);
      compressedUrl.pathname = pathname + variant.ext;
      const compressedRequest = new Request(compressedUrl.toString(), mappedRequest);
      
      try {
        const response = await env.ASSETS.fetch(compressedRequest);
        
        if (response.ok) {
          // Found compressed version, add appropriate headers
          const headers = new Headers(response.headers);
          headers.set('Content-Encoding', variant.encoding);
          headers.set('Vary', 'Accept-Encoding');
          
          // Remove the .gz or .br extension from Content-Type detection
          const originalContentType = getMimeType(pathname);
          if (originalContentType) {
            headers.set('Content-Type', originalContentType);
          }
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        }
      } catch (err) {
        // Compressed version not found, continue to next variant or original
        logger.debug(`Compressed variant ${variant.ext} not found for ${pathname}`);
      }
    }
  }
  
  // Fall back to original uncompressed asset
  try {
    const response = await env.ASSETS.fetch(mappedRequest);
    
    if (!response.ok && response.status === 404) {
      throw new WorkerError(
        ErrorType.NOT_FOUND,
        404,
        'Asset not found',
        { path: pathname }
      );
    }
    
    // Add Vary header for compressible content even if serving uncompressed
    if (isCompressible(pathname)) {
      const headers = new Headers(response.headers);
      headers.set('Vary', 'Accept-Encoding');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return response;
  } catch (error: any) {
    // Re-throw WorkerError as-is
    if (error instanceof WorkerError) {
      throw error;
    }
    
    logger.error('Failed to fetch asset', {
      error: error.message,
      stack: error.stack,
      path: pathname,
    });
    
    throw new WorkerError(
      ErrorType.INTERNAL_ERROR,
      500,
      'Failed to fetch asset',
      { originalError: error.message }
    );
  }
}

/**
 * Processes the asset response with proper headers
 */
export function processAssetResponse(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);
  
  // Set correct MIME type
  const contentType = getMimeType(pathname);
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  
  // Apply cache headers
  const cacheHeaders = getCacheHeaders(pathname);
  Object.entries(cacheHeaders).forEach(([key, value]) => {
    headers.set(key, value as string);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handles 404 errors by serving a custom 404 page
 */
export async function handle404(context: WorkerContext): Promise<Response> {
  const { env } = context;
  const url = new URL(context.request.url);
  
  try {
    // Try to fetch the 404.html page
    const notFoundRequest = new Request(new URL('/404.html', url.origin).toString());
    const notFoundContext = { ...context, request: notFoundRequest };
    
    const notFoundResponse = await fetchAsset(notFoundContext);
    
    // Return the 404 page with 404 status
    return new Response(notFoundResponse.body, {
      status: 404,
      statusText: 'Not Found',
      headers: notFoundResponse.headers,
    });
  } catch (error) {
    // Fallback if 404.html doesn't exist
    logger.warn('404.html not found, using fallback');
    
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Not Found</title>
  <style>
    body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
    h1 { color: #333; }
    p { color: #666; }
    a { color: #0066cc; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>404 - Page Not Found</h1>
  <p>The page you are looking for does not exist.</p>
  <p><a href="/">Go to homepage</a></p>
</body>
</html>`,
      {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      }
    );
  }
}

// Export compatibility aliases for easier migration
export const fetchAssetFromKV = fetchAsset;