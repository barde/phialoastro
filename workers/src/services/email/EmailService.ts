import type { EmailProvider, EmailMessage, EmailResponse, EmailServiceConfig } from './types';
import { ResendEmailProvider } from './providers/ResendEmailProvider';
import { logger } from '../../utils/logger';

export class EmailService {
	private providers: EmailProvider[] = [];
	private config: EmailServiceConfig;

	constructor(config: EmailServiceConfig, env: any) {
		logger.info('EmailService constructor called');
		this.config = config;
		logger.info('Starting provider initialization');
		this.initializeProviders(env);
		logger.info('EmailService constructor completed');
	}

	private initializeProviders(env: any): void {
		// Initialize providers based on configuration
		const providers: Array<{ name: string; provider: any; config: any }> = [];

		// Resend provider (priority 1)
		if (this.config.providers.resend?.enabled) {
			providers.push({
				name: 'Resend',
				provider: ResendEmailProvider,
				config: this.config.providers.resend,
			});
		}

		// Other providers disabled - using Resend only

		// Sort by priority
		providers.sort((a, b) => (a.config.priority || 999) - (b.config.priority || 999));

		// Initialize providers
		for (const { name, provider, config } of providers) {
			try {
				const instance = new provider(config);
				this.providers.push(instance);
				logger.info(`Initialized email provider: ${name}`);
			} catch (error) {
				logger.error(`Failed to initialize ${name} email provider`, { error });
				// Continue with other providers
			}
		}

		// Check if any providers were configured
		const hasConfiguredProviders = Object.values(this.config.providers).some(p => p.enabled);
		
		if (this.providers.length === 0) {
			if (!hasConfiguredProviders) {
				throw new Error('Resend is not configured. Please set RESEND_API_KEY.');
			} else {
				throw new Error('Resend could not be initialized despite being configured.');
			}
		}
	}

	async send(email: EmailMessage): Promise<EmailResponse> {
		// Validate email
		this.validateEmail(email);

		// Apply domain restrictions
		this.applyDomainRestrictions(email);

		let lastError: Error | null = null;
		let attempts = 0;

		for (const provider of this.providers) {
			attempts++;
			try {
				// Attempt to send directly without availability check
				logger.info(`Attempting to send email with provider: ${provider.getName()}`);
				const response = await provider.send(email);

				if (response.success) {
					logger.info(`Email sent successfully`, {
						provider: provider.getName(),
						messageId: response.messageId,
					});
					return response;
				} else {
					throw new Error(response.error || 'Unknown error');
				}
			} catch (error) {
				lastError = error as Error;
				logger.error(`Failed to send email with provider ${provider.getName()}`, {
					error: lastError.message,
					attempt: attempts,
				});

				// If fallback is disabled and this isn't the last provider, throw
				if (!this.config.fallbackEnabled && attempts < this.providers.length) {
					throw lastError;
				}

				// Add delay before trying next provider
				if (attempts < this.providers.length) {
					await this.delay(this.config.retryDelay || 1000);
				}
			}
		}

		// All providers failed
		throw new Error(
			`Failed to send email after ${attempts} attempts. Last error: ${lastError?.message}`
		);
	}

	private validateEmail(email: EmailMessage): void {
		if (!email.to || email.to.length === 0) {
			throw new Error('Email must have at least one recipient');
		}

		if (!email.from || !email.from.email) {
			throw new Error('Email must have a valid sender');
		}

		if (!email.subject) {
			throw new Error('Email must have a subject');
		}

		if (!email.text && !email.html) {
			throw new Error('Email must have either text or HTML content');
		}

		// Validate email addresses
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const allAddresses = [
			email.from,
			...email.to,
			...(email.cc || []),
			...(email.bcc || []),
		];

		for (const address of allAddresses) {
			if (address && !emailRegex.test(address.email)) {
				throw new Error(`Invalid email address: ${address.email}`);
			}
		}
	}

	private applyDomainRestrictions(email: EmailMessage): void {
		const { allowedDomains, blockedDomains } = this.config;

		// Check all recipient addresses
		const allRecipients = [
			...email.to,
			...(email.cc || []),
			...(email.bcc || []),
		];

		for (const recipient of allRecipients) {
			const domain = recipient.email.split('@')[1];

			// Check blocked domains
			if (blockedDomains && blockedDomains.includes(domain)) {
				throw new Error(`Domain ${domain} is blocked`);
			}

			// Check allowed domains (if specified, only these are allowed)
			if (allowedDomains && allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
				throw new Error(`Domain ${domain} is not in the allowed list`);
			}
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async testConnection(): Promise<Record<string, boolean>> {
		const results: Record<string, boolean> = {};

		for (const provider of this.providers) {
			try {
				results[provider.getName()] = await provider.isAvailable();
			} catch (error) {
				results[provider.getName()] = false;
			}
		}

		return results;
	}
}