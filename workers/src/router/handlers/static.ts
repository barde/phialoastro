import { WorkerContext } from '../../types/worker';
import { fetchAsset, handle404 } from '../../handlers/assets-modern';
import { logger } from '../../utils/logger';

/**
 * Handle static asset requests
 */
export async function handleStaticAsset(context: WorkerContext): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  
  try {
    // Fetch the asset using modern ASSETS binding
    const assetResponse = await fetchAsset(context);
    
    logger.debug('Served static asset', {
      path: url.pathname,
      status: assetResponse.status,
      contentType: assetResponse.headers.get('Content-Type'),
    });
    
    return assetResponse;
  } catch (error: any) {
    // Handle 404 errors specially
    if (error.statusCode === 404) {
      logger.debug('Asset not found, serving 404 page', { path: url.pathname });
      return handle404(context);
    }
    
    // Re-throw other errors to be handled by the global error handler
    throw error;
  }
}