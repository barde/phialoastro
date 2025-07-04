import type { EmailProvider, EmailMessage, EmailResponse } from '../types';
import { logger } from '../../../utils/logger';

interface SendGridConfig {
	enabled: boolean;
	priority: number;
	apiKey: string;
	fromEmail?: string;
	fromName?: string;
}

interface SendGridPersonalization {
	to: Array<{ email: string; name?: string }>;
	cc?: Array<{ email: string; name?: string }>;
	bcc?: Array<{ email: string; name?: string }>;
}

interface SendGridContent {
	type: string;
	value: string;
}

interface SendGridRequest {
	personalizations: SendGridPersonalization[];
	from: { email: string; name?: string };
	reply_to?: { email: string; name?: string };
	subject: string;
	content: SendGridContent[];
	headers?: Record<string, string>;
	categories?: string[];
	custom_args?: Record<string, any>;
}

export class SendGridEmailProvider implements EmailProvider {
	private config: SendGridConfig;
	private apiUrl = 'https://api.sendgrid.com/v3/mail/send';

	constructor(config: SendGridConfig) {
		this.config = config;
		if (!this.config.apiKey) {
			throw new Error('SendGrid API key is required');
		}
	}

	getName(): string {
		return 'SendGrid';
	}

	async isAvailable(): Promise<boolean> {
		// Simple check - just verify we have an API key
		return !!this.config.apiKey;
	}

	async send(email: EmailMessage): Promise<EmailResponse> {
		try {
			const sendGridRequest = this.buildSendGridRequest(email);
			
			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.config.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(sendGridRequest),
			});

			const responseText = await response.text();
			
			if (response.ok) {
				// SendGrid returns 202 for accepted messages
				const messageId = response.headers.get('X-Message-Id') || 'sendgrid-' + Date.now();
				
				logger.info('Email sent successfully via SendGrid', {
					messageId,
					to: email.to.map(addr => addr.email).join(', '),
					subject: email.subject,
				});

				return {
					success: true,
					messageId,
					provider: this.getName(),
				};
			} else {
				let errorDetails;
				try {
					errorDetails = JSON.parse(responseText);
				} catch {
					errorDetails = responseText;
				}

				logger.error('SendGrid API error', {
					status: response.status,
					statusText: response.statusText,
					error: errorDetails,
				});

				return {
					success: false,
					provider: this.getName(),
					error: `SendGrid error: ${response.statusText}`,
					details: errorDetails,
				};
			}
		} catch (error) {
			logger.error('Failed to send email via SendGrid', { error });
			
			return {
				success: false,
				provider: this.getName(),
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	private buildSendGridRequest(email: EmailMessage): SendGridRequest {
		// Build personalizations
		const personalization: SendGridPersonalization = {
			to: email.to.map(addr => ({ email: addr.email, name: addr.name })),
		};

		if (email.cc && email.cc.length > 0) {
			personalization.cc = email.cc.map(addr => ({ email: addr.email, name: addr.name }));
		}

		if (email.bcc && email.bcc.length > 0) {
			personalization.bcc = email.bcc.map(addr => ({ email: addr.email, name: addr.name }));
		}

		// Build content array
		const content: SendGridContent[] = [];
		
		if (email.text) {
			content.push({
				type: 'text/plain',
				value: email.text,
			});
		}

		if (email.html) {
			content.push({
				type: 'text/html',
				value: email.html,
			});
		}

		// Build the request
		const request: SendGridRequest = {
			personalizations: [personalization],
			from: {
				email: this.config.fromEmail || email.from.email,
				name: this.config.fromName || email.from.name,
			},
			subject: email.subject,
			content,
		};

		// Add optional fields
		if (email.replyTo) {
			request.reply_to = {
				email: email.replyTo.email,
				name: email.replyTo.name,
			};
		}

		if (email.headers) {
			request.headers = email.headers;
		}

		if (email.tags && email.tags.length > 0) {
			request.categories = email.tags;
		}

		if (email.metadata) {
			request.custom_args = email.metadata;
		}

		return request;
	}
}