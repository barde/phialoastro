import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { WorkerContext, WorkerError, ErrorType, AssetHandlerOptions } from '../types/worker';
import { getMimeType } from '../utils/mime';
import { logger } from '../utils/logger';

// @ts-expect-error
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

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
 * Get cache control headers based on file type
 */
export function getCacheHeaders(pathname: string): HeadersInit {
  const headers: HeadersInit = {};
  
  // Immutable assets (hashed filenames)
  if (pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/)) {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }
  // Images
  else if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/)) {
    headers['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=604800';
  }
  // HTML files
  else if (pathname.match(/\.html$/) || pathname === '/') {
    headers['Cache-Control'] = 'public, max-age=0, must-revalidate';
  }
  // Default
  else {
    headers['Cache-Control'] = 'public, max-age=3600';
  }
  
  return headers;
}

/**
 * Fetches an asset from KV storage with proper error handling
 */
export async function fetchAssetFromKV(
  context: WorkerContext,
  options?: AssetHandlerOptions
): Promise<Response> {
  const { request, env, ctx } = context;
  
  const kvOptions = {
    ASSET_NAMESPACE: env.__STATIC_CONTENT,
    ASSET_MANIFEST: assetManifest,
    mapRequestToAsset: options?.mapRequestToAsset || mapRequestToAsset,
    cacheControl: options?.cacheControl,
  };
  
  try {
    const response = await getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      },
      kvOptions
    );
    
    return response;
  } catch (error: any) {
    // Re-throw as WorkerError for consistent error handling
    if (error.status === 404) {
      throw new WorkerError(
        ErrorType.NOT_FOUND,
        404,
        'Asset not found',
        { path: new URL(request.url).pathname }
      );
    }
    
    logger.error('Failed to fetch asset from KV', {
      error: error.message,
      stack: error.stack,
      path: new URL(request.url).pathname,
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
  const { env, ctx } = context;
  const url = new URL(context.request.url);
  
  try {
    // Try to fetch the 404.html page
    const notFoundRequest = new Request(new URL('/404.html', url.origin).toString());
    const notFoundContext = { ...context, request: notFoundRequest };
    
    const notFoundResponse = await fetchAssetFromKV(notFoundContext);
    
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