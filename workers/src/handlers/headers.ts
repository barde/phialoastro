import { CSP_DIRECTIVES } from '../config';

export function applyHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  const csp = CSP_DIRECTIVES.join('; ');
  headers.set('Content-Security-Policy', csp);
  
  const pathname = new URL(request.url).pathname;
  
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