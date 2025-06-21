import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// @ts-expect-error
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export interface Env {
  __STATIC_CONTENT: any;
  ENVIRONMENT?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Simple asset serving using Workers Sites
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e: any) {
      // Handle 404s
      if (e.status === 404) {
        return new Response('Not Found', { status: 404 });
      }
      
      // Log error for debugging
      console.error('Worker error:', e.message || e);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};