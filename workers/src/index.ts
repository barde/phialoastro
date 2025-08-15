import { WorkerEnv, WorkerContext } from './types/worker';
import { createRouter } from './router';
import { handleError } from './utils/errors';
import { applySecurityHeaders } from './handlers/security';
import { logger, LogLevel } from './utils/logger';
import { getEnvironmentConfig } from './config/index';
import { compressionMiddleware } from './handlers/compression';
import { cachingMiddleware } from './handlers/caching';

// Initialize router
const router = createRouter();

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext
  ): Promise<Response> {
    const context: WorkerContext = { request, env, ctx };
    
    // Configure logger based on environment
    const config = getEnvironmentConfig(env);
    logger.setLogLevel(config.logLevel);
    
    try {
      // Log request
      const headers: Record<string, string> = {};
      for (const [key, value] of request.headers.entries()) {
        headers[key] = value;
      }
      
      logger.info('Incoming request', {
        method: request.method,
        url: request.url,
        headers
      });
      
      // Create middleware chain
      const middlewareChain = async (): Promise<Response> => {
        console.log('About to call router.fetch');
        // itty-router v5 requires passing env and ctx as separate arguments  
        const response = await router.fetch(request, env, ctx);
        console.log('Router returned response:', response);
        
        if (!response) {
          throw new Error('No response from router');
        }
        
        return response;
      };
      
      // Apply compression middleware
      let response = await compressionMiddleware(request, context, middlewareChain);
      
      // Apply caching middleware
      response = await cachingMiddleware(request, context, async () => response);
      
      // Apply security headers
      return applySecurityHeaders(response, request);
    } catch (error) {
      // Handle errors gracefully
      return handleError(error, request);
    }
  },
};

// Export types for external use
export type { WorkerEnv } from './types/worker';