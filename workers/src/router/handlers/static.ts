import { WorkerContext } from '../../types/worker';
import { fetchAssetFromKV, processAssetResponse, handle404 } from '../../handlers/assets';
import { logger } from '../../utils/logger';

/**
 * Handle static asset requests
 */
export async function handleStaticAsset(context: WorkerContext): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  
  try {
    // Fetch the asset from KV
    const assetResponse = await fetchAssetFromKV(context);
    
    // Process and return the response
    const processedResponse = processAssetResponse(assetResponse, url.pathname);
    
    logger.debug('Served static asset', {
      path: url.pathname,
      status: processedResponse.status,
      contentType: processedResponse.headers.get('Content-Type'),
    });
    
    return processedResponse;
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