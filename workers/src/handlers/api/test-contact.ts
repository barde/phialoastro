import { Request as IttyRequest } from 'itty-router';
import type { CloudflareEnv } from '../../types/worker';
import { API_SECURITY_HEADERS } from '../../config';

export async function testHandleContactForm(request: IttyRequest, env: CloudflareEnv): Promise<Response> {
  console.log('testHandleContactForm - START');
  
  try {
    // Check request method
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': 'POST',
          ...API_SECURITY_HEADERS,
        },
      });
    }

    // Parse request body
    console.log('Parsing body...');
    let body: any;
    try {
      body = await request.json();
      console.log('Body parsed:', body);
    } catch (error) {
      console.error('JSON parse error:', error);
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          ...API_SECURITY_HEADERS,
        },
      });
    }

    // Return simple success response
    console.log('Returning success response');
    return new Response(JSON.stringify({
      success: true,
      message: 'Test successful',
      receivedData: body
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...API_SECURITY_HEADERS,
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'An unexpected error occurred',
      details: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...API_SECURITY_HEADERS,
      },
    });
  }
}