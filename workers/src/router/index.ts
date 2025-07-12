import { Router, IRequest } from 'itty-router';
import { WorkerContext } from '../types/worker';
import { handleStaticAsset } from './handlers/static';
import { handleRedirect } from './handlers/redirect';
import { validateRequest } from '../utils/errors';
import { withCache } from '../middleware/cache';
import { withTiming } from '../middleware/timing';
import { withCORS } from '../middleware/cors';
import { handleContactForm } from '../handlers/api/contact';

// Extend Request with context
interface ContextRequest extends IRequest {
  context: WorkerContext;
}

/**
 * Create and configure the router
 */
export function createRouter() {
  const router = Router<ContextRequest>();

  // Note: itty-router v5 passes all arguments to handlers
  // We'll adapt our middleware to work with this pattern
  
  // Global middleware - these modify the request/response flow
  router.all('*', async (request: ContextRequest, context: WorkerContext) => {
    validateRequest(request);
    request.context = context;
  });
  
  // Handle redirects first
  router.all('*', async (request: ContextRequest) => {
    const response = await handleRedirect(request.context);
    if (response) return response;
  });
  
  // API routes
  router.post('/api/contact', async (request: ContextRequest) => {
    // Apply CORS for API routes
    return withCORS(request.context, async () => {
      return handleContactForm(request, request.context.env);
    });
  });
  
  // Apply middleware chain for GET requests
  router.get('*', async (request: ContextRequest) => {
    // Apply CORS
    const corsResponse = await withCORS(request.context, async () => {
      // Apply timing
      return withTiming(request.context, async () => {
        // Apply cache and handle static assets
        return withCache(handleStaticAsset)(request.context);
      });
    });
    
    return corsResponse;
  });
  
  // Handle OPTIONS requests
  router.options('*', async (request: ContextRequest) => {
    return handleOptions(request.context);
  });

  return router;
}

/**
 * Handle OPTIONS requests
 */
async function handleOptions(context: WorkerContext): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}