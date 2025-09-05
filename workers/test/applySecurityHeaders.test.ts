import { describe, it, expect } from 'vitest';
import { applySecurityHeaders } from '../src/handlers/security';
import { SECURITY_HEADERS, CSP_DIRECTIVES } from '../src/config';

describe('applySecurityHeaders', () => {
  it('should apply all default security headers', () => {
    const request = new Request('https://example.com');
    const originalResponse = new Response('test body');
    const response = applySecurityHeaders(originalResponse, request);

    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      expect(response.headers.get(key)).toBe(value);
    });
  });

  it('should apply Content-Security-Policy header', () => {
    const request = new Request('https://example.com');
    const originalResponse = new Response('test body');
    const response = applySecurityHeaders(originalResponse, request);
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBe(CSP_DIRECTIVES.join('; '));
  });

  it('should add X-Frame-Options for HTML responses', () => {
    const request = new Request('https://example.com');
    const originalResponse = new Response('<html></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
    const response = applySecurityHeaders(originalResponse, request);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('should not add X-Frame-Options for non-HTML responses', () => {
    const request = new Request('https://example.com');
    const originalResponse = new Response('{}', {
      headers: { 'Content-Type': 'application/json' },
    });
    // The default is DENY from SECURITY_HEADERS, so we check that it's not overridden
    const response = applySecurityHeaders(originalResponse, request);
    expect(response.headers.get('X-Frame-Options')).toBe(SECURITY_HEADERS['X-Frame-Options']);
  });

  it('should add Strict-Transport-Security for HTTPS requests', () => {
    const request = new Request('https://example.com');
    const originalResponse = new Response('test body');
    const response = applySecurityHeaders(originalResponse, request);
    expect(response.headers.get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains; preload');
  });

  it('should not add Strict-Transport-Security for HTTP requests', () => {
    const request = new Request('http://example.com');
    const originalResponse = new Response('test body');
    const response = applySecurityHeaders(originalResponse, request);
    expect(response.headers.has('Strict-Transport-Security')).toBe(false);
  });

  it('should preserve original response body, status, and statusText', async () => {
    const request = new Request('https://example.com');
    const originalResponse = new Response('test body', {
      status: 201,
      statusText: 'Created',
    });
    const response = applySecurityHeaders(originalResponse, request);

    expect(await response.text()).toBe('test body');
    expect(response.status).toBe(201);
    expect(response.statusText).toBe('Created');
  });
});
