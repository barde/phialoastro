import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  fetchAssetFromKV, 
  processAssetResponse, 
  handle404, 
  mapRequestToAsset, 
  getCacheHeaders 
} from '../src/handlers/assets';
import { WorkerContext, WorkerError, ErrorType } from '../src/types/worker';

// Mock @cloudflare/kv-asset-handler
vi.mock('@cloudflare/kv-asset-handler', () => ({
  getAssetFromKV: vi.fn(),
}));

// Mock logger
vi.mock('../src/utils/logger', () => ({
  LogLevel: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
  },
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    setConfig: vi.fn(),
  },
}));

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

describe('Asset Handlers', () => {
  let mockContext: WorkerContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockContext = {
      request: new Request('https://example.com/'),
      env: {
        __STATIC_CONTENT: {} as any,
      },
      ctx: {
        waitUntil: vi.fn(),
        passThroughOnException: vi.fn(),
      } as any,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mapRequestToAsset', () => {
    it('should map root path to index.html', () => {
      const request = new Request('https://example.com/');
      const mapped = mapRequestToAsset(request);
      expect(new URL(mapped.url).pathname).toBe('/index.html');
    });

    it('should append index.html to directory paths', () => {
      const request = new Request('https://example.com/about/');
      const mapped = mapRequestToAsset(request);
      expect(new URL(mapped.url).pathname).toBe('/about/index.html');
    });

    it('should treat extensionless paths as directories', () => {
      const request = new Request('https://example.com/portfolio');
      const mapped = mapRequestToAsset(request);
      expect(new URL(mapped.url).pathname).toBe('/portfolio/index.html');
    });

    it('should not modify paths with file extensions', () => {
      const request = new Request('https://example.com/script.js');
      const mapped = mapRequestToAsset(request);
      expect(new URL(mapped.url).pathname).toBe('/script.js');
    });

    it('should preserve query parameters', () => {
      const request = new Request('https://example.com/page?param=value');
      const mapped = mapRequestToAsset(request);
      const url = new URL(mapped.url);
      expect(url.pathname).toBe('/page/index.html');
      expect(url.search).toBe('?param=value');
    });

    it('should preserve hash fragments', () => {
      const request = new Request('https://example.com/page#section');
      const mapped = mapRequestToAsset(request);
      const url = new URL(mapped.url);
      expect(url.pathname).toBe('/page/index.html');
      expect(url.hash).toBe('#section');
    });
  });

  describe('getCacheHeaders', () => {
    it('should return immutable cache for JS/CSS files', () => {
      expect(getCacheHeaders('/app.js')['Cache-Control']).toBe('public, max-age=31536000, immutable');
      expect(getCacheHeaders('/styles.css')['Cache-Control']).toBe('public, max-age=31536000, immutable');
    });

    it('should return immutable cache for font files', () => {
      expect(getCacheHeaders('/font.woff2')['Cache-Control']).toBe('public, max-age=31536000, immutable');
      expect(getCacheHeaders('/font.ttf')['Cache-Control']).toBe('public, max-age=31536000, immutable');
    });

    it('should return shorter cache for images', () => {
      expect(getCacheHeaders('/image.jpg')['Cache-Control']).toBe('public, max-age=86400, stale-while-revalidate=604800');
      expect(getCacheHeaders('/logo.png')['Cache-Control']).toBe('public, max-age=86400, stale-while-revalidate=604800');
      expect(getCacheHeaders('/icon.svg')['Cache-Control']).toBe('public, max-age=86400, stale-while-revalidate=604800');
    });

    it('should return no-cache for HTML files', () => {
      expect(getCacheHeaders('/index.html')['Cache-Control']).toBe('public, max-age=0, must-revalidate');
      expect(getCacheHeaders('/about.html')['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    });

    it('should return no-cache for root path', () => {
      expect(getCacheHeaders('/')['Cache-Control']).toBe('public, max-age=0, must-revalidate');
    });

    it('should return default cache for unknown types', () => {
      expect(getCacheHeaders('/data.json')['Cache-Control']).toBe('public, max-age=3600');
      expect(getCacheHeaders('/unknown.xyz')['Cache-Control']).toBe('public, max-age=3600');
    });
  });

  describe('fetchAssetFromKV', () => {
    it('should fetch assets successfully', async () => {
      const mockResponse = new Response('Test content', { status: 200 });
      vi.mocked(getAssetFromKV).mockResolvedValueOnce(mockResponse);

      const response = await fetchAssetFromKV(mockContext);

      expect(response).toBe(mockResponse);
      expect(getAssetFromKV).toHaveBeenCalledWith(
        {
          request: mockContext.request,
          waitUntil: expect.any(Function),
        },
        expect.objectContaining({
          ASSET_NAMESPACE: mockContext.env.__STATIC_CONTENT,
          mapRequestToAsset: expect.any(Function),
        })
      );
    });

    it('should handle 404 errors', async () => {
      const error = new Error('Not found');
      (error as any).status = 404;
      vi.mocked(getAssetFromKV).mockRejectedValueOnce(error);

      await expect(fetchAssetFromKV(mockContext)).rejects.toThrow(WorkerError);
      
      try {
        await fetchAssetFromKV(mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkerError);
        expect((error as WorkerError).type).toBe(ErrorType.NOT_FOUND);
        expect((error as WorkerError).statusCode).toBe(404);
      }
    });

    it('should handle other errors', async () => {
      const error = new Error('KV error');
      vi.mocked(getAssetFromKV).mockRejectedValueOnce(error);

      await expect(fetchAssetFromKV(mockContext)).rejects.toThrow(WorkerError);
      
      try {
        await fetchAssetFromKV(mockContext);
      } catch (error) {
        expect(error).toBeInstanceOf(WorkerError);
        expect((error as WorkerError).type).toBe(ErrorType.INTERNAL_ERROR);
        expect((error as WorkerError).statusCode).toBe(500);
      }
    });

    it('should use custom mapRequestToAsset if provided', async () => {
      const customMapper = vi.fn((req: Request) => req);
      const mockResponse = new Response('Test', { status: 200 });
      vi.mocked(getAssetFromKV).mockResolvedValueOnce(mockResponse);

      await fetchAssetFromKV(mockContext, { mapRequestToAsset: customMapper });

      expect(getAssetFromKV).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          mapRequestToAsset: customMapper,
        })
      );
    });
  });

  describe('processAssetResponse', () => {
    it('should set correct MIME type for HTML files', () => {
      const original = new Response('<html></html>', { status: 200 });
      const processed = processAssetResponse(original, '/index.html');
      
      expect(processed.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    });

    it('should set correct MIME type for JavaScript files', () => {
      const original = new Response('console.log("test");', { status: 200 });
      const processed = processAssetResponse(original, '/app.js');
      
      expect(processed.headers.get('Content-Type')).toBe('application/javascript; charset=utf-8');
    });

    it('should apply cache headers', () => {
      const original = new Response('body { color: red; }', { status: 200 });
      const processed = processAssetResponse(original, '/styles.css');
      
      expect(processed.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    });

    it('should preserve original status and headers', () => {
      const original = new Response('Not Found', {
        status: 404,
        headers: {
          'X-Custom': 'value',
          'ETag': '"123"',
        },
      });
      const processed = processAssetResponse(original, '/missing.html');
      
      expect(processed.status).toBe(404);
      expect(processed.headers.get('X-Custom')).toBe('value');
      expect(processed.headers.get('ETag')).toBe('"123"');
    });
  });

  describe('handle404', () => {
    it('should return custom 404 page when available', async () => {
      const mock404Response = new Response('<h1>404</h1>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      vi.mocked(getAssetFromKV).mockResolvedValueOnce(mock404Response);

      const response = await handle404(mockContext);

      expect(response.status).toBe(404);
      expect(response.statusText).toBe('Not Found');
      expect(await response.text()).toBe('<h1>404</h1>');
    });

    it('should return fallback 404 page when custom page is missing', async () => {
      vi.mocked(getAssetFromKV).mockRejectedValueOnce(new Error('Not found'));

      const response = await handle404(mockContext);

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
      const text = await response.text();
      expect(text).toContain('404 - Page Not Found');
      expect(text).toContain('Go to homepage');
    });

    it('should create correct 404.html request', async () => {
      mockContext.request = new Request('https://example.com/missing/path');
      vi.mocked(getAssetFromKV).mockRejectedValueOnce(new Error('Not found'));

      await handle404(mockContext);

      expect(getAssetFromKV).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            url: 'https://example.com/404.html',
          }),
        }),
        expect.any(Object)
      );
    });
  });
});