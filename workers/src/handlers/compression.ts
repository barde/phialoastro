/**
 * Compression Handler for Cloudflare Workers
 * Handles content negotiation and serves pre-compressed assets
 */

import type { Context } from '../types/index';

// Content types that benefit from compression
const COMPRESSIBLE_TYPES = new Set([
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
  'image/svg+xml',
  'application/vnd.ms-fontobject',
  'application/x-font-ttf',
  'font/opentype',
  'text/plain',
  'application/ld+json',
  'application/manifest+json',
]);

// Content types that should never be compressed (already compressed)
const INCOMPRESSIBLE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'font/woff',
  'font/woff2',
  'application/pdf',
  'application/zip',
  'application/gzip',
  'application/x-gzip',
  'application/x-bzip2',
  'application/x-7z-compressed',
]);

/**
 * Check if content type should be compressed
 */
export function shouldCompress(contentType: string | null): boolean {
  if (!contentType) return false;
  
  // Extract base content type (remove charset, etc.)
  const baseType = contentType.split(';')[0].trim().toLowerCase();
  
  // Check if explicitly incompressible
  if (INCOMPRESSIBLE_TYPES.has(baseType)) {
    return false;
  }
  
  // Check if explicitly compressible
  if (COMPRESSIBLE_TYPES.has(baseType)) {
    return true;
  }
  
  // Check if text-based (catch-all for text/* types)
  if (baseType.startsWith('text/')) {
    return true;
  }
  
  // Check if JSON-like
  if (baseType.includes('json')) {
    return true;
  }
  
  // Default to no compression for unknown types
  return false;
}

/**
 * Parse Accept-Encoding header and return supported encodings
 */
export function parseAcceptEncoding(header: string | null): {
  br: boolean;
  gzip: boolean;
  deflate: boolean;
} {
  if (!header) {
    return { br: false, gzip: false, deflate: false };
  }
  
  const normalized = header.toLowerCase();
  return {
    br: normalized.includes('br'),
    gzip: normalized.includes('gzip'),
    deflate: normalized.includes('deflate'),
  };
}

/**
 * Get the best available encoding based on client support and availability
 */
export function getBestEncoding(
  acceptEncoding: ReturnType<typeof parseAcceptEncoding>,
  available: { br?: boolean; gzip?: boolean } = {}
): 'br' | 'gzip' | null {
  // Prefer Brotli if both client and server support it
  if (acceptEncoding.br && available.br !== false) {
    return 'br';
  }
  
  // Fall back to gzip if supported
  if (acceptEncoding.gzip && available.gzip !== false) {
    return 'gzip';
  }
  
  // No compression available or supported
  return null;
}

/**
 * Try to fetch pre-compressed version of an asset
 */
export async function fetchCompressedAsset(
  context: Context,
  pathname: string,
  acceptEncoding: ReturnType<typeof parseAcceptEncoding>
): Promise<{ response: Response | null; encoding: string | null }> {
  const { env } = context;
  
  // Check if we have ASSETS binding (for static files)
  if (!env.ASSETS) {
    return { response: null, encoding: null };
  }
  
  // Try Brotli first if client supports it
  if (acceptEncoding.br) {
    try {
      // Try to fetch .br version
      const brPath = `${pathname}.br`;
      const brResponse = await env.ASSETS.fetch(new Request(`https://dummy${brPath}`));
      
      if (brResponse.ok) {
        return { response: brResponse, encoding: 'br' };
      }
    } catch (error) {
      // Brotli version not found, continue
    }
  }
  
  // Try gzip if client supports it
  if (acceptEncoding.gzip) {
    try {
      // Try to fetch .gz version
      const gzPath = `${pathname}.gz`;
      const gzResponse = await env.ASSETS.fetch(new Request(`https://dummy${gzPath}`));
      
      if (gzResponse.ok) {
        return { response: gzResponse, encoding: 'gzip' };
      }
    } catch (error) {
      // Gzip version not found, continue
    }
  }
  
  // No compressed version found
  return { response: null, encoding: null };
}

/**
 * Apply compression headers to response
 */
export function applyCompressionHeaders(
  response: Response,
  encoding: string | null,
  originalContentType?: string
): Response {
  if (!encoding) {
    return response;
  }
  
  const headers = new Headers(response.headers);
  
  // Set Content-Encoding header
  headers.set('Content-Encoding', encoding);
  
  // Add Vary header to indicate content negotiation
  const currentVary = headers.get('Vary') || '';
  if (!currentVary.toLowerCase().includes('accept-encoding')) {
    headers.set('Vary', currentVary ? `${currentVary}, Accept-Encoding` : 'Accept-Encoding');
  }
  
  // Ensure correct Content-Type (should be original file type, not compressed type)
  if (originalContentType) {
    headers.set('Content-Type', originalContentType);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware to handle compression for responses
 */
export async function compressionMiddleware(
  request: Request,
  context: Context,
  next: () => Promise<Response>
): Promise<Response> {
  const acceptEncoding = parseAcceptEncoding(request.headers.get('Accept-Encoding'));
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // For static assets, try to serve pre-compressed versions
  if (context.env.ASSETS) {
    // Check if this looks like a static asset request
    const isStaticAsset = /\.(js|css|html|svg|json|xml|txt)$/i.test(pathname);
    
    if (isStaticAsset) {
      const { response: compressedResponse, encoding } = await fetchCompressedAsset(
        context,
        pathname,
        acceptEncoding
      );
      
      if (compressedResponse && encoding) {
        // Determine original content type
        const extension = pathname.split('.').pop()?.toLowerCase();
        const contentType = getContentTypeForExtension(extension || '');
        
        return applyCompressionHeaders(compressedResponse, encoding, contentType);
      }
    }
  }
  
  // Continue with normal request handling
  const response = await next();
  
  // Check if response should be compressed
  const contentType = response.headers.get('Content-Type');
  const contentEncoding = response.headers.get('Content-Encoding');
  
  // Skip if already compressed or shouldn't be compressed
  if (contentEncoding || !shouldCompress(contentType)) {
    return response;
  }
  
  // For dynamic content, we could implement runtime compression here
  // However, for now we'll just return the uncompressed response
  // Runtime compression with WASM would be added here if needed
  
  return response;
}

/**
 * Get content type for file extension
 */
function getContentTypeForExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css; charset=utf-8',
    'js': 'application/javascript; charset=utf-8',
    'json': 'application/json; charset=utf-8',
    'svg': 'image/svg+xml; charset=utf-8',
    'xml': 'application/xml; charset=utf-8',
    'txt': 'text/plain; charset=utf-8',
    'webmanifest': 'application/manifest+json',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Create a compressed response (for dynamic content)
 * Note: This would require brotli-wasm or similar library for runtime compression
 */
export async function createCompressedResponse(
  content: string | ArrayBuffer,
  contentType: string,
  acceptEncoding: ReturnType<typeof parseAcceptEncoding>
): Promise<Response> {
  // Determine if content should be compressed
  if (!shouldCompress(contentType)) {
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
      },
    });
  }
  
  // For now, return uncompressed
  // TODO: Implement runtime compression with brotli-wasm if needed for dynamic content
  return new Response(content, {
    headers: {
      'Content-Type': contentType,
    },
  });
}