import { WorkerEnv, WorkerContext } from './types/worker';
import { createRouter } from './router';
import { handleError } from './utils/errors';
import { applySecurityHeaders } from './handlers/security';
import { logger, LogLevel } from './utils/logger';
import { getEnvironmentConfig } from './config/index';

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
      
      // Handle request through router
      console.log('About to call router.handle');
      const response = await router.handle(request, context);
      console.log('Router returned response:', response);
      
      if (!response) {
        throw new Error('No response from router');
      }
      
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