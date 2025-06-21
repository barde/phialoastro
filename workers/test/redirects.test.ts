import { describe, it, expect } from 'vitest';
import { handleRedirects } from '../src/handlers/redirects';

describe('Redirects Handler', () => {
  it('should remove trailing slashes except for root', async () => {
    const request = new Request('https://example.com/about/');
    const response = await handleRedirects(request);

    expect(response).toBeDefined();
    expect(response?.status).toBe(301);
    expect(response?.headers.get('Location')).toBe('https://example.com/about');
  });

  it('should not remove trailing slash from root', async () => {
    const request = new Request('https://example.com/');
    const response = await handleRedirects(request);

    expect(response).toBeUndefined();
  });

  it('should not redirect paths without trailing slashes', async () => {
    const request = new Request('https://example.com/about');
    const response = await handleRedirects(request);

    expect(response).toBeUndefined();
  });

  it('should handle paths with query parameters', async () => {
    const request = new Request('https://example.com/about/?lang=en');
    const response = await handleRedirects(request);

    expect(response).toBeDefined();
    expect(response?.status).toBe(301);
    expect(response?.headers.get('Location')).toBe('https://example.com/about?lang=en');
  });

  it('should handle paths with hash fragments', async () => {
    const request = new Request('https://example.com/about/#section');
    const response = await handleRedirects(request);

    expect(response).toBeDefined();
    expect(response?.status).toBe(301);
    expect(response?.headers.get('Location')).toBe('https://example.com/about#section');
  });

  // Test for future redirect rules when they are re-enabled
  it('should handle redirect rules when implemented', async () => {
    // Currently no redirect rules are active
    const request = new Request('https://example.com/jewelry');
    const response = await handleRedirects(request);

    // Should return undefined as no rules are currently active
    expect(response).toBeUndefined();
  });
});