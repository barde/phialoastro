export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT?: string;
  PR_NUMBER?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // The static assets binding handles all the heavy lifting
    // Including SPA routing, 404 handling, and serving files
    return env.ASSETS.fetch(request);
  },
};