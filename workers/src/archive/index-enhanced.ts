import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { getMimeType } from './utils/mime';

// @ts-expect-error
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export interface Env {
  __STATIC_CONTENT: any;
  ENVIRONMENT?: string;
  PR_NUMBER?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    try {
      // Configure asset handling options with proper path mapping
      const options = {
        ASSET_NAMESPACE: env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: (req: Request) => {
          const url = new URL(req.url);
          let pathname = url.pathname;
          
          // Default to index.html for directory requests
          if (pathname === '/') {
            pathname = '/index.html';
          } else if (pathname.endsWith('/')) {
            pathname = pathname + 'index.html';
          } else if (!pathname.includes('.') && pathname !== '/404') {
            // Try to append /index.html for paths without extensions
            pathname = pathname + '/index.html';
          }
          
          url.pathname = pathname;
          return new Request(url.toString(), req);
        },
      };
      
      // Get the asset from KV
      const response = await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        options
      );
      
      // Create new headers with correct MIME type
      const headers = new Headers(response.headers);
      const contentType = getMimeType(url.pathname);
      if (contentType) {
        headers.set('Content-Type', contentType);
      }
      
      // Add cache headers based on file type
      const pathname = url.pathname;
      if (pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/)) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/)) {
        headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      } else if (pathname.match(/\.html$/) || pathname === '/') {
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      }
      
      // Add security headers
      headers.set('X-Frame-Options', 'SAMEORIGIN');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
    } catch (e: any) {
      // Handle 404s with custom page if available
      if (e.status === 404) {
        try {
          const notFoundRequest = new Request(new URL('/404.html', url.origin).toString());
          const notFoundResponse = await getAssetFromKV(
            {
              request: notFoundRequest,
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: assetManifest,
            }
          );
          
          return new Response(notFoundResponse.body, {
            status: 404,
            headers: {
              'Content-Type': 'text/html; charset=UTF-8',
              'Cache-Control': 'no-cache',
            },
          });
        } catch {
          // Fallback if 404.html doesn't exist
          return new Response('Not Found', { status: 404 });
        }
      }
      
      // Log error for debugging
      console.error('Worker error:', e.message || e);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};