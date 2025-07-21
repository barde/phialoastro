import type { TurnstileValidationResult } from '../email/types';
import { logger } from '../../utils/logger';

interface TurnstileServiceConfig {
	secretKey: string;
	allowedHostnames?: string[];
	allowedOrigins?: string[];
}

export class TurnstileService {
	private secretKey: string;
	private allowedHostnames: Set<string>;
	private allowedOrigins: Set<string>;
	private siteVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

	constructor(config: TurnstileServiceConfig | string) {
		if (typeof config === 'string') {
			// Backward compatibility
			this.secretKey = config;
			this.allowedHostnames = new Set();
			this.allowedOrigins = new Set();
		} else {
			if (!config.secretKey) {
				throw new Error('Turnstile secret key is required');
			}
			this.secretKey = config.secretKey;
			this.allowedHostnames = new Set(config.allowedHostnames || []);
			this.allowedOrigins = new Set(config.allowedOrigins || []);
		}
	}

	async validate(token: string, ip?: string, options?: { origin?: string; hostname?: string }): Promise<TurnstileValidationResult> {
		try {
			// Build form data
			const formData = new FormData();
			formData.append('secret', this.secretKey);
			formData.append('response', token);
			
			if (ip) {
				formData.append('remoteip', ip);
			}

			// Send validation request
			const response = await fetch(this.siteVerifyUrl, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`Turnstile API error: ${response.status}`);
			}

			const result = await response.json() as TurnstileValidationResult;

			if (result.success) {
				// Perform additional security checks if configured
				if (this.allowedHostnames.size > 0 && result.hostname) {
					if (!this.allowedHostnames.has(result.hostname)) {
						logger.warn('Turnstile validation failed: hostname not allowed', {
							hostname: result.hostname,
							allowed: Array.from(this.allowedHostnames),
						});
						return {
							...result,
							success: false,
							error_codes: ['hostname-not-allowed'],
						};
					}
				}

				// Check origin if provided and allowlist is configured
				if (this.allowedOrigins.size > 0 && options?.origin) {
					if (!this.allowedOrigins.has(options.origin)) {
						logger.warn('Turnstile validation failed: origin not allowed', {
							origin: options.origin,
							allowed: Array.from(this.allowedOrigins),
						});
						return {
							...result,
							success: false,
							error_codes: ['origin-not-allowed'],
						};
					}
				}

				logger.info('Turnstile validation successful', {
					hostname: result.hostname,
					challenge_ts: result.challenge_ts,
				});
			} else {
				logger.warn('Turnstile validation failed', {
					error_codes: result.error_codes,
				});
			}

			return result;
		} catch (error) {
			logger.error('Turnstile validation error', { error });
			
			return {
				success: false,
				error_codes: ['internal-error'],
			};
		}
	}

	isTestKey(): boolean {
		// Check if using a test key (1x... or 2x... patterns)
		return this.secretKey.startsWith('1x') || this.secretKey.startsWith('2x');
	}

	// Create from environment for easier configuration
	static fromEnv(env: any): TurnstileService {
		const allowedHostnames = env.TURNSTILE_ALLOWED_HOSTNAMES
			? env.TURNSTILE_ALLOWED_HOSTNAMES.split(',').map((h: string) => h.trim())
			: [];
			
		const allowedOrigins = env.TURNSTILE_ALLOWED_ORIGINS
			? env.TURNSTILE_ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
			: [];

		return new TurnstileService({
			secretKey: env.TURNSTILE_SECRET_KEY,
			allowedHostnames,
			allowedOrigins,
		});
	}
}