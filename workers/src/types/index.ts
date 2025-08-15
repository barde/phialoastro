/**
 * Common types for the Workers application
 */

import type { WorkerEnv, WorkerContext } from './worker';

// Re-export worker types
export type { WorkerEnv, WorkerContext } from './worker';

// Context type for middleware
export type Context = WorkerContext;

// Request handler type
export type RequestHandler = (
  request: Request,
  context: Context
) => Promise<Response> | Response;

// Middleware type
export type Middleware = (
  request: Request,
  context: Context,
  next: () => Promise<Response>
) => Promise<Response>;