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
    // Set up environment-specific configuration
    const environment = env.ENVIRONMENT || 'production';
    const config = getEnvironmentConfig(environment);
    
    // Configure logger
    logger.setConfig({
      minLevel: config.debug ? LogLevel.DEBUG : LogLevel.INFO,
    });
    
    // Create worker context
    const context: WorkerContext = { request, env, ctx };
    
    try {
      // Handle request through router
      const response = await router.handle(request, context);
      
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