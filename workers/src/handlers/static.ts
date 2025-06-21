import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import { getMimeType } from '../utils/mime';

// @ts-expect-error
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export async function handleStatic(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  
  try {
    // Configure asset handling options
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
        } else if (!pathname.includes('.')) {
          // Check if it's a directory by looking for index.html
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
    
    return handleAssetResponse(response, url.pathname);
  } catch (error: any) {
    // Handle 404 errors
    if (error.status === 404) {
      return handle404(env, url, ctx);
    }
    
    console.error('Error serving static asset:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function handleAssetResponse(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);
  
  // Set correct MIME type
  const contentType = getMimeType(pathname);
  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  
  // Add cache headers based on file type
  if (pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/)) {
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  } else if (pathname.match(/\.html$/) || pathname === '/') {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handle404(env: any, url: URL, ctx: ExecutionContext): Promise<Response> {
  try {
    const options = {
      ASSET_NAMESPACE: env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
    };
    
    const request = new Request(new URL('/404.html', url.origin).toString());
    const notFoundResponse = await getAssetFromKV(
      {
        request,
        waitUntil: ctx.waitUntil.bind(ctx),
      },
      options
    );
    
    if (notFoundResponse) {
      return new Response(notFoundResponse.body, {
        status: 404,
        headers: notFoundResponse.headers,
      });
    }
  } catch {
    // Fallback if 404.html doesn't exist
  }
  
  return new Response('Not Found', { status: 404 });
}