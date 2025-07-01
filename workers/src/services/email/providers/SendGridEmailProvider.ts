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

interface SendGridMailData {
	personalizations: SendGridPersonalization[];
	from: { email: string; name?: string };
	reply_to?: { email: string; name?: string };
	subject: string;
	content: Array<{ type: string; value: string }>;
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
		try {
			// Test the API key by making a simple request
			const response = await fetch('https://api.sendgrid.com/v3/scopes', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${this.config.apiKey}`,
				},
			});
			return response.ok;
		} catch (error) {
			logger.error('SendGrid availability check failed', { error });
			return false;
		}
	}

	async send(email: EmailMessage): Promise<EmailResponse> {
		try {
			// Build SendGrid mail data
			const mailData: SendGridMailData = {
				personalizations: [{
					to: email.to.map(addr => ({ email: addr.email, name: addr.name })),
					...(email.cc && { cc: email.cc.map(addr => ({ email: addr.email, name: addr.name })) }),
					...(email.bcc && { bcc: email.bcc.map(addr => ({ email: addr.email, name: addr.name })) }),
				}],
				from: {
					email: this.config.fromEmail || email.from.email,
					name: this.config.fromName || email.from.name,
				},
				subject: email.subject,
				content: [],
			};

			// Add reply-to if provided
			if (email.replyTo) {
				mailData.reply_to = {
					email: email.replyTo.email,
					name: email.replyTo.name,
				};
			}

			// Add content
			if (email.text) {
				mailData.content.push({
					type: 'text/plain',
					value: email.text,
				});
			}

			if (email.html) {
				mailData.content.push({
					type: 'text/html',
					value: email.html,
				});
			}

			// Add headers
			if (email.headers) {
				mailData.headers = email.headers;
			}

			// Add categories (tags)
			if (email.tags && email.tags.length > 0) {
				mailData.categories = email.tags;
			}

			// Add custom args (metadata)
			if (email.metadata) {
				mailData.custom_args = email.metadata;
			}

			// Send the email
			const response = await fetch(this.apiUrl, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.config.apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(mailData),
			});

			if (response.ok) {
				// SendGrid returns the message ID in the X-Message-Id header
				const messageId = response.headers.get('X-Message-Id') || `sg-${Date.now()}`;
				
				logger.info('Email sent via SendGrid', { messageId });

				return {
					success: true,
					messageId,
					provider: this.getName(),
				};
			} else {
				const error = await response.text();
				throw new Error(`SendGrid API error: ${response.status} - ${error}`);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			logger.error('Failed to send email via SendGrid', { error: errorMessage });

			return {
				success: false,
				provider: this.getName(),
				error: errorMessage,
			};
		}
	}
}