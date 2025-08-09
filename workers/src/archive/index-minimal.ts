export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('Worker is running! URL: ' + request.url, {
      headers: { 'content-type': 'text/plain' }
    });
  }
};