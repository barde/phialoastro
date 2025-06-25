export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  ENVIRONMENT?: string;
  PR_NUMBER?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    try {
      // Try to fetch the asset
      const response = await env.ASSETS.fetch(request);
      
      // If successful, return it
      if (response.status !== 404) {
        return response;
      }
      
      // For 404s, check if this is a client-side route (no file extension)
      const url = new URL(request.url);
      const hasExtension = url.pathname.includes('.');
      
      // If no extension and 404, serve index.html for SPA routing
      if (!hasExtension) {
        const indexRequest = new Request(new URL('/', url.origin).toString(), request);
        return env.ASSETS.fetch(indexRequest);
      }
      
      // Otherwise, return the 404
      return response;
    } catch (e) {
      // Return a generic error response
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};