export interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  ENVIRONMENT?: string;
  PR_NUMBER?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    // The static assets binding handles all the heavy lifting
    // Including SPA routing, 404 handling, and serving files
    return env.ASSETS.fetch(request);
  },
};