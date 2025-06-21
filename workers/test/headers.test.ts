import { describe, it, expect, beforeEach } from 'vitest';
import { applyHeaders } from '../src/handlers/headers';

describe('Headers Handler', () => {
  let mockRequest: Request;
  let mockResponse: Response;

  beforeEach(() => {
    mockRequest = new Request('https://example.com/test.html');
    mockResponse = new Response('Test body', {
      status: 200,
      headers: new Headers({
        'Content-Type': 'text/html',
      }),
    });
  });

  it('should apply security headers', () => {
    const result = applyHeaders(mockResponse, mockRequest);
    const headers = result.headers;

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toBe('geolocation=(), microphone=(), camera=()');
  });

  it('should apply Content-Security-Policy header', () => {
    const result = applyHeaders(mockResponse, mockRequest);
    const csp = result.headers.get('Content-Security-Policy');

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.weglot.com");
    expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('should apply correct cache headers for JavaScript files', () => {
    const jsRequest = new Request('https://example.com/script.js');
    const result = applyHeaders(mockResponse, jsRequest);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('should apply correct cache headers for CSS files', () => {
    const cssRequest = new Request('https://example.com/styles.css');
    const result = applyHeaders(mockResponse, cssRequest);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('should apply correct cache headers for font files', () => {
    const fontRequest = new Request('https://example.com/font.woff2');
    const result = applyHeaders(mockResponse, fontRequest);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
  });

  it('should apply correct cache headers for image files', () => {
    const imageRequest = new Request('https://example.com/image.jpg');
    const result = applyHeaders(mockResponse, imageRequest);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=86400, stale-while-revalidate=604800');
  });

  it('should apply correct cache headers for HTML files', () => {
    const htmlRequest = new Request('https://example.com/index.html');
    const result = applyHeaders(mockResponse, htmlRequest);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
  });

  it('should apply correct cache headers for root path', () => {
    const rootRequest = new Request('https://example.com/');
    const result = applyHeaders(mockResponse, rootRequest);

    expect(result.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
  });

  it('should preserve original response status and body', () => {
    const originalResponse = new Response('Original body', {
      status: 404,
      statusText: 'Not Found',
    });

    const result = applyHeaders(originalResponse, mockRequest);

    expect(result.status).toBe(404);
    expect(result.statusText).toBe('Not Found');
  });
});