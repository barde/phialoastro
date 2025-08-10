import { IRequest as IttyRequest } from 'itty-router';
import { EmailService } from '../../services/email/EmailService';
import { TurnstileServiceEnhanced } from '../../services/turnstile/TurnstileServiceEnhanced';
import { generateContactEmailTemplate, generateContactConfirmationTemplate } from '../../services/email/templates';
import type { ContactFormData, EmailServiceConfig } from '../../services/email/types';
import { logger } from '../../utils/logger';
import type { CloudflareEnv } from '../../types/worker';
import { API_SECURITY_HEADERS } from '../../config';

// Request signing utilities
const generateRequestSignature = async (
	payload: string,
	secret: string,
	timestamp: number
): Promise<string> => {
	const encoder = new TextEncoder();
	const data = encoder.encode(`${timestamp}.${payload}`);
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, data);
	return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

const verifyRequestSignature = async (
	payload: string,
	signature: string,
	secret: string,
	timestamp: number,
	maxAge: number = 300000 // 5 minutes
): Promise<boolean> => {
	// Check timestamp age
	if (Date.now() - timestamp > maxAge) {
		return false;
	}

	// Generate expected signature
	const expectedSignature = await generateRequestSignature(payload, secret, timestamp);
	return signature === expectedSignature;
};

export async function handleContactFormEnhanced(request: IttyRequest, env: CloudflareEnv): Promise<Response> {
	logger.info('handleContactFormEnhanced called');
	
	// Performance tracking
	const startTime = performance.now();
	
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

		// Enhanced origin validation
		const origin = request.headers.get('Origin');
		const referer = request.headers.get('Referer');
		const allowedOrigins = env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
		
		if (allowedOrigins.length > 0 && origin && !allowedOrigins.includes(origin)) {
			logger.warn('Request from unauthorized origin', { origin, referer });
			return new Response(JSON.stringify({ error: 'Unauthorized origin' }), {
				status: 403,
				headers: {
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Parse request body
		let body: any;
		const bodyText = await request.text();
		
		try {
			body = JSON.parse(bodyText);
		} catch (error) {
			return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Verify request signature if enabled
		if (env.ENABLE_REQUEST_SIGNING === 'true' && env.REQUEST_SIGNING_SECRET) {
			const signature = request.headers.get('X-Signature');
			const timestamp = parseInt(request.headers.get('X-Timestamp') || '0', 10);
			
			if (!signature || !timestamp) {
				return new Response(JSON.stringify({ error: 'Missing request signature' }), {
					status: 401,
					headers: { 
						'Content-Type': 'application/json',
						...API_SECURITY_HEADERS,
					},
				});
			}

			const isValidSignature = await verifyRequestSignature(
				bodyText,
				signature,
				env.REQUEST_SIGNING_SECRET,
				timestamp
			);

			if (!isValidSignature) {
				logger.warn('Invalid request signature');
				return new Response(JSON.stringify({ error: 'Invalid request signature' }), {
					status: 401,
					headers: { 
						'Content-Type': 'application/json',
						...API_SECURITY_HEADERS,
					},
				});
			}
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

		// Enhanced email validation
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

		// Enhanced Turnstile validation with cross-domain protection
		if (env.TURNSTILE_SECRET_KEY && body.turnstileToken) {
			const turnstileService = TurnstileServiceEnhanced.fromEnv(env);
			
			// Add current hostname to allowed list if not in development
			if (env.ENVIRONMENT !== 'development') {
				const requestUrl = new URL(request.url);
				turnstileService.addAllowedHostname(requestUrl.hostname);
			}

			const turnstileResult = await turnstileService.validate({
				token: body.turnstileToken,
				ip: request.headers.get('CF-Connecting-IP') || undefined,
				origin: origin || undefined,
				hostname: new URL(request.url).hostname,
				idempotencyKey: body.idempotencyKey,
			});

			if (!turnstileResult.success) {
				logger.warn('Turnstile validation failed', {
					error_codes: turnstileResult.error_codes,
					action: turnstileResult.action,
				});
				
				// Track failed attempts in KV if available
				if (env.TURNSTILE_ANALYTICS) {
					const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
					const key = `turnstile:failed:${ip}`;
					const count = parseInt(await env.TURNSTILE_ANALYTICS.get(key) || '0', 10);
					await env.TURNSTILE_ANALYTICS.put(key, String(count + 1), {
						expirationTtl: 3600, // 1 hour
					});
				}
				
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

			// Track successful validation
			if (env.TURNSTILE_ANALYTICS) {
				const key = `turnstile:success:${new Date().toISOString().split('T')[0]}`;
				const count = parseInt(await env.TURNSTILE_ANALYTICS.get(key) || '0', 10);
				await env.TURNSTILE_ANALYTICS.put(key, String(count + 1), {
					expirationTtl: 86400 * 30, // 30 days
				});
			}
		}

		// Rate limiting check
		if (env.CONTACT_RATE_LIMIT) {
			const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
			const rateLimitKey = `ratelimit:contact:${ip}`;
			const attempts = await env.CONTACT_RATE_LIMIT.get(rateLimitKey);
			
			if (attempts) {
				const count = parseInt(attempts, 10);
				const maxAttempts = parseInt(env.MAX_CONTACT_ATTEMPTS || '5', 10);
				
				if (count >= maxAttempts) {
					logger.warn('Rate limit exceeded', { ip, attempts: count });
					return new Response(JSON.stringify({ 
						error: 'Too many requests. Please try again later.',
					}), {
						status: 429,
						headers: { 
							'Content-Type': 'application/json',
							'Retry-After': '3600', // 1 hour
							...API_SECURITY_HEADERS,
						},
					});
				}
				
				await env.CONTACT_RATE_LIMIT.put(rateLimitKey, String(count + 1), {
					expirationTtl: 3600, // 1 hour
				});
			} else {
				await env.CONTACT_RATE_LIMIT.put(rateLimitKey, '1', {
					expirationTtl: 3600, // 1 hour
				});
			}
		}

		// Prepare contact form data with sanitization
		const sanitize = (str: string): string => {
			return str.trim().replace(/[<>]/g, ''); // Basic XSS prevention
		};

		const contactData: ContactFormData = {
			name: sanitize(body.name),
			email: body.email.trim().toLowerCase(),
			phone: body.phone ? sanitize(body.phone) : undefined,
			subject: sanitize(body.subject),
			message: sanitize(body.message),
			language: body.language || 'de',
			metadata: {
				userAgent: request.headers.get('User-Agent') || undefined,
				ipAddress: request.headers.get('CF-Connecting-IP') || undefined,
				timestamp: new Date().toISOString(),
				referrer: request.headers.get('Referer') || undefined,
				country: request.headers.get('CF-IPCountry') || undefined,
				// Add performance metrics
				processingTime: performance.now() - startTime,
			},
		};

		// Configure email service
		const emailConfig: EmailServiceConfig = {
			providers: {
				resend: {
					enabled: !!env.RESEND_API_KEY,
					priority: 1,
					apiKey: env.RESEND_API_KEY || '',
					fromEmail: env.FROM_EMAIL || 'onboarding@resend.dev',
					fromName: 'Phialo Design',
				},
				sendgrid: {
					enabled: false,
					priority: 2,
					apiKey: '',
					fromEmail: '',
					fromName: '',
				},
				google: {
					enabled: false,
					priority: 3,
					serviceAccountKey: '',
					delegatedEmail: undefined,
				},
			},
			fallbackEnabled: false,
			maxRetries: 3,
			retryDelay: 1000,
			allowedDomains: env.ALLOWED_EMAIL_DOMAINS?.split(',').map(d => d.trim()),
			blockedDomains: env.BLOCKED_EMAIL_DOMAINS?.split(',').map(d => d.trim()),
		};

		// Initialize email service
		let emailService: EmailService;
		try {
			emailService = new EmailService(emailConfig, env);
		} catch (error) {
			logger.error('Failed to initialize email service', { error });
			
			return new Response(JSON.stringify({ 
				error: 'Email service is not configured. Please set RESEND_API_KEY.',
				details: env.ENVIRONMENT === 'development' ? error.message : undefined,
			}), {
				status: 503,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Generate email template
		const mainEmailTemplate = generateContactEmailTemplate(contactData);

		// Send main notification email
		const mainEmailResponse = await emailService.send({
			from: {
				email: env.FROM_EMAIL || 'noreply@phialo.de',
				name: 'Phialo Website',
			},
			to: [{
				email: env.TO_EMAIL || 'info@phialo.de',
				name: 'Phialo Design',
			}],
			replyTo: {
				email: contactData.email,
				name: contactData.name,
			},
			subject: mainEmailTemplate.subject,
			html: mainEmailTemplate.html,
			text: mainEmailTemplate.text,
			tags: ['contact-form', contactData.language],
			metadata: {
				formId: 'contact',
				language: contactData.language,
				processingTime: String(performance.now() - startTime),
			},
		});

		if (!mainEmailResponse.success) {
			logger.error('Failed to send main email', { error: mainEmailResponse.error });
			
			return new Response(JSON.stringify({ 
				error: 'Failed to send message. Please try again later.',
			}), {
				status: 500,
				headers: { 
					'Content-Type': 'application/json',
					...API_SECURITY_HEADERS,
				},
			});
		}

		// Send confirmation email to user
		if (body.sendCopy !== false) {
			try {
				const confirmationTemplate = generateContactConfirmationTemplate(contactData);
				
				await emailService.send({
					from: {
						email: env.FROM_EMAIL || 'noreply@phialo.de',
						name: 'Phialo Design',
					},
					to: [{
						email: contactData.email,
						name: contactData.name,
					}],
					subject: confirmationTemplate.subject,
					html: confirmationTemplate.html,
					text: confirmationTemplate.text,
					tags: ['contact-form-confirmation', contactData.language],
					metadata: {
						formId: 'contact-confirmation',
						language: contactData.language,
					},
				});

				logger.info('Confirmation email sent to user', { email: contactData.email });
			} catch (error) {
				// Don't fail the request if confirmation email fails
				logger.error('Failed to send confirmation email', { error });
			}
		}

		// Track successful submission
		if (env.CONTACT_ANALYTICS) {
			const key = `contact:success:${new Date().toISOString().split('T')[0]}`;
			const count = parseInt(await env.CONTACT_ANALYTICS.get(key) || '0', 10);
			await env.CONTACT_ANALYTICS.put(key, String(count + 1), {
				expirationTtl: 86400 * 90, // 90 days
			});
		}

		// Return success response with performance metrics
		const totalTime = performance.now() - startTime;
		
		return new Response(JSON.stringify({
			success: true,
			message: contactData.language === 'de' 
				? 'Ihre Nachricht wurde erfolgreich gesendet.'
				: 'Your message has been sent successfully.',
			messageId: mainEmailResponse.messageId,
			processingTime: env.ENVIRONMENT === 'development' ? `${totalTime.toFixed(2)}ms` : undefined,
		}), {
			status: 200,
			headers: { 
				'Content-Type': 'application/json',
				'X-Processing-Time': `${totalTime.toFixed(2)}ms`,
				...API_SECURITY_HEADERS,
			},
		});

	} catch (error) {
		logger.error('Unexpected error in contact form handler', { 
			error,
			processingTime: performance.now() - startTime,
		});
		
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

// Export for backward compatibility
export { handleContactFormEnhanced as handleContactForm };