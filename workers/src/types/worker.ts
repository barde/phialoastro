import { ExecutionContext } from '@cloudflare/workers-types';

/**
 * Environment variables and bindings available to the worker
 */
export interface WorkerEnv {
  ASSETS: Fetcher;  // Modern assets binding
  EMAIL_QUEUE: Queue<any>;  // Email queue binding
  BRANCH_NAME?: string;
  ENVIRONMENT?: 'development' | 'preview' | 'production' | 'test';
  WEB3FORMS_ACCESS_KEY?: string;
  
  // Email service configuration
  RESEND_API_KEY?: string;
  SENDGRID_API_KEY?: string;
  GOOGLE_SERVICE_ACCOUNT_KEY?: string;
  GOOGLE_DELEGATED_EMAIL?: string;
  
  // Email settings
  FROM_EMAIL?: string;
  TO_EMAIL?: string;
  ALLOWED_EMAIL_DOMAINS?: string;
  BLOCKED_EMAIL_DOMAINS?: string;
  
  // Turnstile
  TURNSTILE_SECRET_KEY?: string;
  
  // PR deployment
  PR_NUMBER?: string;
}

// Type alias for CloudflareEnv (used in some files)
export type CloudflareEnv = WorkerEnv;

/**
 * Worker context with request, environment, and execution context
 */
export interface WorkerContext {
  request: Request;
  env: WorkerEnv;
  ctx: ExecutionContext;
}

/**
 * Handler function type for worker routes
 */
export type RouteHandler = (context: WorkerContext) => Promise<Response> | Response;

/**
 * Middleware function type
 */
export type Middleware = (
  context: WorkerContext,
  next: () => Promise<Response>
) => Promise<Response> | Response;

/**
 * Asset handler options
 */
export interface AssetHandlerOptions {
  cacheControl?: {
    browserTTL?: number;
    edgeTTL?: number;
    bypassCache?: boolean;
  };
  mapRequestToAsset?: (request: Request) => Request;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  cacheName?: string;
  cacheKey?: Request | string;
  ttl?: number;
}

/**
 * Error types for better error handling
 */
export enum ErrorType {
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
}

/**
 * Custom error class for worker errors
 */
export class WorkerError extends Error {
  constructor(
    public type: ErrorType,
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WorkerError';
  }
}