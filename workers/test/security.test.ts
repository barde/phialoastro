import { describe, it, expect } from 'vitest';
import { applyHeaders } from '../src/handlers/headers';

describe('Security Headers', () => {
  describe('Content Security Policy', () => {
    it('should include all required CSP directives', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      const csp = result.headers.get('Content-Security-Policy');
      expect(csp).toBeDefined();
      
      // Check all directives
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
      expect(csp).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
      expect(csp).toContain("img-src 'self' data: https: blob:");
      expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
      expect(csp).toContain("connect-src 'self'");
      expect(csp).toContain("media-src 'self' https:");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it('should have properly formatted CSP header', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      const csp = result.headers.get('Content-Security-Policy');
      // Should not have trailing semicolons or extra spaces
      expect(csp).not.toMatch(/;\s*;/);
      expect(csp).not.toMatch(/;\s*$/);
      expect(csp).not.toMatch(/\s{2,}/);
    });
  });

  describe('Security Headers Completeness', () => {
    it('should include all OWASP recommended headers', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      // Check all security headers
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      expect(result.headers.get('X-XSS-Protection')).toBe('1; mode=block');
      expect(result.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
      expect(result.headers.get('Permissions-Policy')).toBeDefined();
      expect(result.headers.get('Content-Security-Policy')).toBeDefined();
    });

    it('should include Permissions-Policy with restricted features', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      const policy = result.headers.get('Permissions-Policy');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('camera=()');
    });
  });

  describe('Cache Headers by Content Type', () => {
    const testCases = [
      {
        path: '/script.js',
        expectedCache: 'public, max-age=31536000, immutable',
        description: 'JavaScript files',
      },
      {
        path: '/styles.css',
        expectedCache: 'public, max-age=31536000, immutable',
        description: 'CSS files',
      },
      {
        path: '/font.woff2',
        expectedCache: 'public, max-age=31536000, immutable',
        description: 'Font files',
      },
      {
        path: '/image.jpg',
        expectedCache: 'public, max-age=86400, stale-while-revalidate=604800',
        description: 'Image files',
      },
      {
        path: '/page.html',
        expectedCache: 'public, max-age=0, must-revalidate',
        description: 'HTML files',
      },
      {
        path: '/',
        expectedCache: 'public, max-age=0, must-revalidate',
        description: 'Root path',
      },
    ];

    testCases.forEach(({ path, expectedCache, description }) => {
      it(`should set correct cache headers for ${description}`, () => {
        const request = new Request(`https://example.com${path}`);
        const response = new Response('Test', { status: 200 });
        const result = applyHeaders(response, request);
        
        expect(result.headers.get('Cache-Control')).toBe(expectedCache);
      });
    });
  });

  describe('Special Cases', () => {
    it('should handle requests with custom headers', () => {
      const request = new Request('https://example.com/', {
        headers: {
          'X-Custom-Header': 'custom-value',
          'Authorization': 'Bearer token',
        },
      });
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      // Should still apply security headers
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should preserve existing response headers', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Test', {
        status: 200,
        headers: {
          'X-Custom-Response': 'preserved',
          'ETag': '"123456"',
        },
      });
      const result = applyHeaders(response, request);
      
      // Should preserve original headers
      expect(result.headers.get('X-Custom-Response')).toBe('preserved');
      expect(result.headers.get('ETag')).toBe('"123456"');
      
      // And add security headers
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should handle error responses', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Not Found', {
        status: 404,
        statusText: 'Not Found',
      });
      const result = applyHeaders(response, request);
      
      // Should still apply security headers to error responses
      expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(result.headers.get('X-Frame-Options')).toBe('DENY');
      
      // Should preserve error status
      expect(result.status).toBe(404);
      expect(result.statusText).toBe('Not Found');
    });
  });

  describe('Cache Header Edge Cases', () => {
    it('should handle files with multiple extensions', () => {
      const request = new Request('https://example.com/app.min.js');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    it('should handle query parameters in URLs', () => {
      const request = new Request('https://example.com/script.js?v=1.2.3');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      expect(result.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    it('should handle hash fragments in URLs', () => {
      const request = new Request('https://example.com/page.html#section');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      expect(result.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
    });

    it('should not set cache headers for unknown file types', () => {
      const request = new Request('https://example.com/unknown.xyz');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      // Should not have a Cache-Control header for unknown types
      expect(result.headers.get('Cache-Control')).toBeNull();
    });
  });

  describe('CORS Headers', () => {
    it('should not include CORS headers by default', () => {
      const request = new Request('https://example.com/');
      const response = new Response('Test', { status: 200 });
      const result = applyHeaders(response, request);
      
      expect(result.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(result.headers.get('Access-Control-Allow-Methods')).toBeNull();
    });
  });
});