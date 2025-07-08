import { IRequest as IttyRequest } from 'itty-router';
import { TurnstileService } from '../../services/turnstile/TurnstileService';
import { sendContactEmails, type ResendMailerConfig } from '../../services/email/resend-mailer';
import type { ContactFormData } from '../../services/email/types';
import { logger } from '../../utils/logger';
import type { CloudflareEnv } from '../../types/worker';
import { API_SECURITY_HEADERS } from '../../config';

export async function handleContactForm(request: IttyRequest, env: CloudflareEnv): Promise<Response> {
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

		// Check if Resend API key is configured
		if (!env.RESEND_API_KEY) {
			logger.error('Resend API key not configured');
			return new Response(JSON.stringify({ 
				error: 'Email service not configured. Please contact administrator.',
			}), {
				status: 500,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Configure email service
		const mailerConfig: ResendMailerConfig = {
			resendApiKey: env.RESEND_API_KEY,
			fromEmail: env.FROM_EMAIL,
			fromName: env.FROM_NAME,
			toEmail: env.TO_EMAIL,
		};

		// Send emails using Resend
		logger.info('Sending contact form emails', {
			from: contactData.email,
			subject: contactData.subject,
			toEmail: env.TO_EMAIL || 'info@phialo.de',
		});

		const emailResult = await sendContactEmails(contactData, mailerConfig);

		if (!emailResult.success) {
			logger.error('Failed to send emails', { error: emailResult.error });
			return new Response(JSON.stringify({ 
				error: 'Failed to send email. Please try again later.',
				details: emailResult.error,
			}), {
				status: 500,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Return success response
		logger.info('Contact form emails sent successfully');
		return new Response(JSON.stringify({
			success: true,
			message: contactData.language === 'de' 
				? 'Vielen Dank für Ihre Nachricht. Wir werden uns in Kürze bei Ihnen melden.'
				: 'Thank you for your message. We will get back to you soon.',
		}), {
			status: 200,
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