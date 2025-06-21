export function withCache(handler: Function) {
  return async function (request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
    
    let response = await cache.match(cacheKey);
    
    if (!response) {
      response = await handler(request, env, ctx);
      
      if (response.status === 200) {
        const headers = new Headers(response.headers);
        headers.set('CF-Cache-Status', 'MISS');
        
        const cachedResponse = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
        
        ctx.waitUntil(cache.put(cacheKey, cachedResponse.clone()));
        
        return cachedResponse;
      }
    } else {
      const headers = new Headers(response.headers);
      headers.set('CF-Cache-Status', 'HIT');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    
    return response;
  };
}