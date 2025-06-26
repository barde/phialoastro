import { getMimeType } from './utils/mime';

export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
  PR_NUMBER?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    try {
      // Map request to correct asset path
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
      
      // Create mapped request
      const mappedUrl = new URL(request.url);
      mappedUrl.pathname = pathname;
      const mappedRequest = new Request(mappedUrl.toString(), request);
      
      // Fetch the asset using the modern ASSETS binding
      const response = await env.ASSETS.fetch(mappedRequest);
      
      // If not found, return the response as-is (will be 404)
      if (!response.ok && response.status === 404) {
        return handle404(request, env);
      }
      
      // Create new headers with correct MIME type
      const headers = new Headers(response.headers);
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
      // Log error for debugging
      console.error('Error fetching asset:', e);
      
      // Return generic error response
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store',
        },
      });
    }
  },
};

// Handle 404 errors with custom page
async function handle404(request: Request, env: Env): Promise<Response> {
  try {
    // Try to fetch custom 404 page
    const notFoundUrl = new URL(request.url);
    notFoundUrl.pathname = '/404.html';
    const notFoundRequest = new Request(notFoundUrl.toString(), request);
    
    const notFoundResponse = await env.ASSETS.fetch(notFoundRequest);
    
    if (notFoundResponse.ok) {
      // Return 404 page with 404 status
      return new Response(notFoundResponse.body, {
        status: 404,
        statusText: 'Not Found',
        headers: notFoundResponse.headers,
      });
    }
  } catch (e) {
    // Ignore errors, fall through to default 404
  }
  
  // Fallback 404 response
  const isApiRequest = request.headers.get('Accept')?.includes('application/json');
  
  if (isApiRequest) {
    return new Response(
      JSON.stringify({
        error: 'Not Found',
        message: 'The requested resource could not be found',
        status: 404,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
  
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