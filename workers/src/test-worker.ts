export default {
  async fetch(request: Request): Promise<Response> {
    console.log('Test worker - request received');
    const url = new URL(request.url);
    
    if (url.pathname === '/api/test') {
      console.log('Test API endpoint hit');
      return new Response(JSON.stringify({ success: true, message: 'Test worker is working' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new Response('Not found', { status: 404 });
  },
};