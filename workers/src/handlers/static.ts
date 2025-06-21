import { getMimeType } from '../utils/mime';

export async function handleStatic(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  let pathname = url.pathname;
  
  // Default to index.html for directory requests
  if (pathname === '/') {
    pathname = '/index.html';
  } else if (!pathname.includes('.') && !pathname.endsWith('/')) {
    // Try adding .html extension for clean URLs
    pathname = `${pathname}.html`;
  }
  
  try {
    // Use the ASSETS binding provided by Wrangler/Workers Sites
    const asset = await env.ASSETS.fetch(new Request(new URL(pathname, url.origin).toString()));
    
    if (!asset || !asset.ok) {
      // Try without .html extension if it was added
      if (pathname.endsWith('.html') && !url.pathname.endsWith('.html')) {
        const originalAsset = await env.ASSETS.fetch(new Request(url.toString()));
        if (originalAsset && originalAsset.ok) {
          return handleAssetResponse(originalAsset, pathname);
        }
      }
      
      // Return 404 page
      return handle404(env, url);
    }
    
    return handleAssetResponse(asset, pathname);
  } catch (error) {
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

async function handle404(env: any, url: URL): Promise<Response> {
  try {
    const notFoundResponse = await env.ASSETS.fetch(
      new Request(new URL('/404.html', url.origin).toString())
    );
    
    if (notFoundResponse && notFoundResponse.ok) {
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