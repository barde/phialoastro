// This file is deprecated - functionality moved to handlers/assets.ts
// Keeping for backward compatibility during migration

import { WorkerContext } from '../types/worker';
import { fetchAssetFromKV, processAssetResponse, handle404 } from './assets';

/**
 * @deprecated Use handlers/assets.ts instead
 */
export async function handleStatic(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
  const context: WorkerContext = { request, env, ctx };
  
  try {
    const response = await fetchAssetFromKV(context);
    return processAssetResponse(response, new URL(request.url).pathname);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return handle404(context);
    }
    throw error;
  }
}