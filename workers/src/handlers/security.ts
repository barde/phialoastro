import { SECURITY_HEADERS, CSP_DIRECTIVES } from '../config';

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  
  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  // Set Content Security Policy
  headers.set('Content-Security-Policy', CSP_DIRECTIVES.join('; '));
  
  // Additional security headers based on content type
  const contentType = headers.get('Content-Type') || '';
  
  if (contentType.includes('text/html')) {
    // Prevent clickjacking for HTML pages
    headers.set('X-Frame-Options', 'DENY');
  }
  
  // HSTS for HTTPS connections
  const url = new URL(request.url);
  if (url.protocol === 'https:') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}