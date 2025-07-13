import { Request as IttyRequest } from 'itty-router';
import { TurnstileService } from '../../services/turnstile/TurnstileService';
import type { ContactFormData } from '../../services/email/types';
import { EmailQueueMessageType } from '../../types/queue';
import { logger } from '../../utils/logger';
import type { CloudflareEnv } from '../../types/worker';
import { API_SECURITY_HEADERS } from '../../config';

export async function handleContactForm(request: IttyRequest, env: CloudflareEnv): Promise<Response> {
	logger.info('handleContactForm called');
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
		let body: any;
		try {
			body = await request.json();
		} catch (error) {
			return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Validate required fields
		const requiredFields = ['name', 'email', 'subject', 'message'];
		const missingFields = requiredFields.filter(field => !body[field]);
		
		if (missingFields.length > 0) {
			return new Response(JSON.stringify({ 
				error: 'Missing required fields',
				fields: missingFields,
			}), {
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return new Response(JSON.stringify({ error: 'Invalid email address' }), {
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Validate Turnstile token if enabled
		if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
			const turnstileService = new TurnstileService(env.TURNSTILE_SECRET_KEY);
			const turnstileResult = await turnstileService.validate(
				body.turnstileToken,
				request.headers.get('CF-Connecting-IP') || undefined
			);

			if (!turnstileResult.success) {
				logger.warn('Turnstile validation failed', {
					error_codes: turnstileResult.error_codes,
				});
				
				return new Response(JSON.stringify({ 
					error: 'Captcha validation failed',
					error_codes: turnstileResult.error_codes,
				}), {
					status: 400,
					headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
				});
			}
		}

		// Prepare contact form data
		const contactData: ContactFormData = {
			name: body.name.trim(),
			email: body.email.trim().toLowerCase(),
			phone: body.phone?.trim(),
			subject: body.subject.trim(),
			message: body.message.trim(),
			language: body.language || 'de',
			metadata: {
				userAgent: request.headers.get('User-Agent') || undefined,
				ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
				timestamp: new Date().toISOString(),
				referrer: request.headers.get('Referer') || undefined,
			},
		};

		// Queue the email for processing
		try {
			logger.info('Queueing contact form email', {
				email: contactData.email,
				subject: contactData.subject,
			});

			// Create queue message
			const queueMessage = {
				id: crypto.randomUUID(),
				type: EmailQueueMessageType.CONTACT_FORM,
				timestamp: new Date().toISOString(),
				retryCount: 0,
				data: contactData,
			};

			// Send to queue
			await env.EMAIL_QUEUE.send(queueMessage);

			logger.info('Contact form email queued successfully', {
				messageId: queueMessage.id,
			});
		} catch (error) {
			logger.error('Failed to queue contact form email', { error });
			
			return new Response(JSON.stringify({ 
				error: 'Failed to process your message. Please try again later.',
			}), {
				status: 500,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Return success response
		return new Response(JSON.stringify({
			success: true,
			message: contactData.language === 'de' 
				? 'Ihre Nachricht wurde erfolgreich empfangen und wird in Kürze bearbeitet.'
				: 'Your message has been received and will be processed shortly.',
		}), {
			status: 202, // 202 Accepted - request has been accepted for processing
			headers: { 
				'Content-Type': 'application/json',
				...API_SECURITY_HEADERS,
			},
		});

	} catch (error) {
		logger.error('Unexpected error in contact form handler', { error });
		
		return new Response(JSON.stringify({ 
			error: 'An unexpected error occurred. Please try again later.',
		}), {
			status: 500,
			headers: { 
				'Content-Type': 'application/json',
				...API_SECURITY_HEADERS,
			},
		});
	}
}