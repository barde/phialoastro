import { Router } from 'itty-router';
import { handleStatic } from './handlers/static';
import { applyHeaders } from './handlers/headers';
import { handleRedirects } from './handlers/redirects';
import { withCache } from './utils/cache';

export interface Env {
  __STATIC_CONTENT: any;
  BRANCH_NAME?: string;
}

const router = Router();

router.all('*', handleRedirects);
router.get('*', withCache(handleStatic));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      const response = await router.handle(request, env, ctx);
      
      if (!response) {
        return new Response('Not Found', { status: 404 });
      }
      
      return applyHeaders(response, request);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};