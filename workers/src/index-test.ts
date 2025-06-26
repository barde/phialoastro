import { Router } from 'itty-router';
import { fetchAsset, handle404 } from './handlers/assets-modern';
import { applyHeaders } from './handlers/headers';
import { handleRedirects } from './handlers/redirects';
import { WorkerEnv, WorkerContext } from './types/worker';

export interface Env extends WorkerEnv {
  PR_NUMBER?: string;
}

const router = Router();

router.all('*', handleRedirects);
router.get('*', async (request: Request, env: Env, ctx: ExecutionContext) => {
  const context: WorkerContext = { request, env, ctx };
  try {
    return await fetchAsset(context);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return handle404(context);
    }
    throw error;
  }
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      console.log('Worker received request:', request.url);
      
      const response = await router.handle(request, env, ctx);
      
      if (!response) {
        console.log('No response from router');
        return new Response('Not Found', { status: 404 });
      }
      
      console.log('Router returned response:', response.status);
      return applyHeaders(response, request);
    } catch (error) {
      console.error('Worker error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      return new Response('Internal Server Error: ' + (error instanceof Error ? error.message : 'Unknown error'), { 
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    }
  },
};