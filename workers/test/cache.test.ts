import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { withCache } from '../src/utils/cache';

// Mock the global caches object
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
};

const mockCaches = {
  default: mockCache,
};

// @ts-ignore
global.caches = mockCaches;

describe('Cache Utility', () => {
  let mockHandler: any;
  let mockRequest: Request;
  let mockEnv: any;
  let mockCtx: ExecutionContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockHandler = vi.fn();
    mockRequest = new Request('https://example.com/test.html');
    mockEnv = {};
    mockCtx = {
      waitUntil: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('withCache wrapper', () => {
    it('should check cache before calling handler', async () => {
      mockCache.match.mockResolvedValueOnce(null);
      mockHandler.mockResolvedValueOnce(new Response('Test content', { status: 200 }));

      const cachedHandler = withCache(mockHandler);
      await cachedHandler(mockRequest, mockEnv, mockCtx);

      expect(mockCache.match).toHaveBeenCalledWith(expect.any(Request));
      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockEnv, mockCtx);
    });

    it('should return cached response when available', async () => {
      const cachedResponse = new Response('Cached content', {
        status: 200,
        headers: new Headers({ 'X-Custom': 'cached' }),
      });
      mockCache.match.mockResolvedValueOnce(cachedResponse);

      const cachedHandler = withCache(mockHandler);
      const response = await cachedHandler(mockRequest, mockEnv, mockCtx);

      expect(mockCache.match).toHaveBeenCalled();
      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.headers.get('CF-Cache-Status')).toBe('HIT');
      expect(await response.text()).toBe('Cached content');
    });

    it('should cache successful responses', async () => {
      mockCache.match.mockResolvedValueOnce(null);
      const freshResponse = new Response('Fresh content', { status: 200 });
      mockHandler.mockResolvedValueOnce(freshResponse);

      const cachedHandler = withCache(mockHandler);
      const response = await cachedHandler(mockRequest, mockEnv, mockCtx);

      expect(response.headers.get('CF-Cache-Status')).toBe('MISS');
      expect(mockCtx.waitUntil).toHaveBeenCalled();
      
      // Verify cache.put was called via waitUntil
      const waitUntilCall = mockCtx.waitUntil.mock.calls[0][0];
      await waitUntilCall; // Execute the promise
      expect(mockCache.put).toHaveBeenCalledWith(
        expect.any(Request),
        expect.any(Response)
      );
    });

    it('should not cache non-200 responses', async () => {
      mockCache.match.mockResolvedValueOnce(null);
      const errorResponse = new Response('Not Found', { status: 404 });
      mockHandler.mockResolvedValueOnce(errorResponse);

      const cachedHandler = withCache(mockHandler);
      const response = await cachedHandler(mockRequest, mockEnv, mockCtx);

      expect(response.status).toBe(404);
      expect(mockCtx.waitUntil).not.toHaveBeenCalled();
      expect(mockCache.put).not.toHaveBeenCalled();
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.match.mockRejectedValueOnce(new Error('Cache error'));
      const freshResponse = new Response('Fresh content', { status: 200 });
      mockHandler.mockResolvedValueOnce(freshResponse);

      const cachedHandler = withCache(mockHandler);
      
      // Should not throw, should fall back to handler
      await expect(cachedHandler(mockRequest, mockEnv, mockCtx)).resolves.toBeDefined();
    });

    it('should preserve response body when caching', async () => {
      mockCache.match.mockResolvedValueOnce(null);
      const originalBody = 'Original content';
      const freshResponse = new Response(originalBody, { status: 200 });
      mockHandler.mockResolvedValueOnce(freshResponse);

      const cachedHandler = withCache(mockHandler);
      const response = await cachedHandler(mockRequest, mockEnv, mockCtx);

      // Body should still be readable after caching
      const responseBody = await response.text();
      expect(responseBody).toBe(originalBody);
    });

    it('should create new request for cache key', async () => {
      mockCache.match.mockResolvedValueOnce(null);
      mockHandler.mockResolvedValueOnce(new Response('Test', { status: 200 }));

      const cachedHandler = withCache(mockHandler);
      await cachedHandler(mockRequest, mockEnv, mockCtx);

      const cacheKeyArg = mockCache.match.mock.calls[0][0];
      expect(cacheKeyArg).toBeInstanceOf(Request);
      expect(cacheKeyArg.url).toBe(mockRequest.url);
    });
  });
});