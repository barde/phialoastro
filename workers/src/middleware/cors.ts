import { WorkerContext } from '../types/worker';

/**
 * CORS configuration
 */
interface CORSConfig {
  allowOrigin: string | string[] | ((origin: string) => boolean);
  allowMethods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  maxAge?: number;
  credentials?: boolean;
}

/**
 * Default CORS configuration
 */
const defaultCORSConfig: CORSConfig = {
  allowOrigin: '*',
  allowMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
  credentials: false,
};

/**
 * CORS middleware
 */
export async function withCORS(
  context: WorkerContext,
  next: () => Promise<Response>
): Promise<Response> {
  const { request } = context;
  const origin = request.headers.get('Origin') || '*';
  
  // Handle preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return handlePreflight(origin, defaultCORSConfig);
  }
  
  // Execute next handler
  const response = await next();
  
  // Add CORS headers to response
  return addCORSHeaders(response, origin, defaultCORSConfig);
}

/**
 * Handle preflight OPTIONS requests
 */
function handlePreflight(origin: string, config: CORSConfig): Response {
  const headers = new Headers();
  
  // Set allowed origin
  const allowedOrigin = getAllowedOrigin(origin, config.allowOrigin);
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }
  
  // Set other CORS headers
  if (config.allowMethods) {
    headers.set('Access-Control-Allow-Methods', config.allowMethods.join(', '));
  }
  
  if (config.allowHeaders) {
    headers.set('Access-Control-Allow-Headers', config.allowHeaders.join(', '));
  }
  
  if (config.maxAge) {
    headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }
  
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(
  response: Response,
  origin: string,
  config: CORSConfig
): Response {
  const headers = new Headers(response.headers);
  
  // Set allowed origin
  const allowedOrigin = getAllowedOrigin(origin, config.allowOrigin);
  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }
  
  // Set exposed headers
  if (config.exposeHeaders) {
    headers.set('Access-Control-Expose-Headers', config.exposeHeaders.join(', '));
  }
  
  // Set credentials
  if (config.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Get allowed origin based on configuration
 */
function getAllowedOrigin(
  requestOrigin: string,
  allowOrigin: string | string[] | ((origin: string) => boolean)
): string | null {
  // Allow all origins
  if (allowOrigin === '*') {
    return '*';
  }
  
  // Check specific origin
  if (typeof allowOrigin === 'string') {
    return requestOrigin === allowOrigin ? requestOrigin : null;
  }
  
  // Check array of origins
  if (Array.isArray(allowOrigin)) {
    return allowOrigin.includes(requestOrigin) ? requestOrigin : null;
  }
  
  // Check with function
  if (typeof allowOrigin === 'function') {
    return allowOrigin(requestOrigin) ? requestOrigin : null;
  }
  
  return null;
}

/**
 * Create CORS middleware with custom configuration
 */
export function createCORS(config: Partial<CORSConfig>) {
  const mergedConfig = { ...defaultCORSConfig, ...config };
  
  return async (
    context: WorkerContext,
    next: () => Promise<Response>
  ): Promise<Response> => {
    const { request } = context;
    const origin = request.headers.get('Origin') || '*';
    
    if (request.method === 'OPTIONS') {
      return handlePreflight(origin, mergedConfig);
    }
    
    const response = await next();
    return addCORSHeaders(response, origin, mergedConfig);
  };
}