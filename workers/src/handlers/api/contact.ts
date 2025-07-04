import { Request as IttyRequest } from 'itty-router';
import { EmailService } from '../../services/email/EmailService';
import { TurnstileService } from '../../services/turnstile/TurnstileService';
import { generateContactEmailTemplate, generateContactConfirmationTemplate } from '../../services/email/templates';
import type { ContactFormData, EmailServiceConfig } from '../../services/email/types';
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

		// Configure email service - SendGrid as primary, Google Workspace as fallback
		const emailConfig: EmailServiceConfig = {
			providers: {
				sendgrid: {
					enabled: !!env.SENDGRID_API_KEY,
					priority: 1,
					apiKey: env.SENDGRID_API_KEY || '',
					fromEmail: env.FROM_EMAIL || 'noreply@phialo.de',
					fromName: 'Phialo Design',
				},
				google: {
					enabled: !!env.GOOGLE_SERVICE_ACCOUNT_KEY,
					priority: 2,
					serviceAccountKey: env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
					delegatedEmail: env.GOOGLE_DELEGATED_EMAIL,
				},
			},
			fallbackEnabled: true, // Enable fallback between providers
			maxRetries: 3,
			retryDelay: 1000,
			allowedDomains: env.ALLOWED_EMAIL_DOMAINS?.split(',').map(d => d.trim()),
			blockedDomains: env.BLOCKED_EMAIL_DOMAINS?.split(',').map(d => d.trim()),
		};

		// Initialize email service
		const emailService = new EmailService(emailConfig, env);

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

		// Send confirmation email to user (Feature #151)
		if (body.sendCopy !== false) { // Default to true
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

		// Return success response
		return new Response(JSON.stringify({
			success: true,
			message: contactData.language === 'de' 
				? 'Ihre Nachricht wurde erfolgreich gesendet.'
				: 'Your message has been sent successfully.',
			messageId: mainEmailResponse.messageId,
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		});

	} catch (error) {
		logger.error('Unexpected error in contact form handler', { error });
		
		return new Response(JSON.stringify({ 
			error: 'An unexpected error occurred. Please try again later.',
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}