import { WorkerEnv, WorkerContext } from './types/worker';
import { createRouter } from './router';
import { handleError } from './utils/errors';
import { applySecurityHeaders } from './handlers/security';
import { logger, LogLevel } from './utils/logger';
import { getEnvironmentConfig } from './config/index';
import { handleEmailQueue } from './handlers/queue/email';

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

  async queue(
    batch: MessageBatch<any>,
    env: WorkerEnv,
    ctx: ExecutionContext
  ): Promise<void> {
    // Configure logger based on environment
    const config = getEnvironmentConfig(env);
    logger.setLogLevel(config.logLevel);
    
    logger.info(`Processing queue batch with ${batch.messages.length} messages`);
    
    try {
      await handleEmailQueue(batch, env, ctx);
    } catch (error) {
      logger.error('Queue processing failed', { error });
      // Retry all messages on critical failure
      batch.retryAll();
    }
  }
};

// Export types for external use
export type { WorkerEnv } from './types/worker';