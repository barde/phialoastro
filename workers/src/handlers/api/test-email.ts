import { IRequest as IttyRequest } from 'itty-router';
import type { CloudflareEnv } from '../../types/worker';
import { API_SECURITY_HEADERS } from '../../config';

export async function handleTestEmail(request: IttyRequest, env: CloudflareEnv): Promise<Response> {
	// Only allow in non-production
	if (env.ENVIRONMENT === 'production') {
		return new Response(JSON.stringify({ error: 'Test endpoint not available in production' }), {
			status: 403,
			headers: { 
				'Content-Type': 'application/json',
				...API_SECURITY_HEADERS,
			},
		});
	}

	try {
		// Simple test response to check if credentials are set
		const hasCredentials = !!(env.GMAIL_ADDRESS && env.GMAIL_APP_PASSWORD);
		
		return new Response(JSON.stringify({
			success: true,
			environment: env.ENVIRONMENT || 'unknown',
			credentialsConfigured: hasCredentials,
			fromEmail: env.FROM_EMAIL || env.GMAIL_ADDRESS || 'not set',
			toEmail: env.TO_EMAIL || 'info@phialo.de',
			message: hasCredentials 
				? 'Email credentials are configured. Use POST /api/contact to send emails.'
				: 'Email credentials are NOT configured. Set GMAIL_ADDRESS and GMAIL_APP_PASSWORD secrets.',
		}), {
			status: 200,
			headers: { 
				'Content-Type': 'application/json',
				...API_SECURITY_HEADERS,
			},
		});
	} catch (error) {
		return new Response(JSON.stringify({ 
			error: 'Test endpoint error',
			details: error instanceof Error ? error.message : 'Unknown error',
		}), {
			status: 500,
			headers: { 
				'Content-Type': 'application/json',
				...API_SECURITY_HEADERS,
			},
		});
	}
}