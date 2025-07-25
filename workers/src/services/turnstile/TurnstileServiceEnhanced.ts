import type { TurnstileValidationResult } from '../email/types';
import { logger } from '../../utils/logger';

interface TurnstileServiceConfig {
	secretKey: string;
	allowedHostnames?: string[];
	allowedOrigins?: string[];
	enableIdempotency?: boolean;
	maxRetries?: number;
	retryDelay?: number;
}

interface EnhancedValidationOptions {
	token: string;
	ip?: string;
	origin?: string;
	hostname?: string;
	idempotencyKey?: string;
}

export class TurnstileServiceEnhanced {
	private secretKey: string;
	private allowedHostnames: Set<string>;
	private allowedOrigins: Set<string>;
	private enableIdempotency: boolean;
	private maxRetries: number;
	private retryDelay: number;
	private siteVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

	constructor(config: TurnstileServiceConfig | string) {
		if (typeof config === 'string') {
			// Backward compatibility
			this.secretKey = config;
			this.allowedHostnames = new Set();
			this.allowedOrigins = new Set();
			this.enableIdempotency = false;
			this.maxRetries = 3;
			this.retryDelay = 1000;
		} else {
			if (!config.secretKey) {
				throw new Error('Turnstile secret key is required');
			}
			
			this.secretKey = config.secretKey;
			this.allowedHostnames = new Set(config.allowedHostnames || []);
			this.allowedOrigins = new Set(config.allowedOrigins || []);
			this.enableIdempotency = config.enableIdempotency ?? true;
			this.maxRetries = config.maxRetries ?? 3;
			this.retryDelay = config.retryDelay ?? 1000;
		}
	}

	private async validateWithRetry(
		formData: FormData,
		retries: number = this.maxRetries
	): Promise<TurnstileValidationResult> {
		try {
			const response = await fetch(this.siteVerifyUrl, {
				method: 'POST',
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`Turnstile API error: ${response.status}`);
			}

			return await response.json() as TurnstileValidationResult;
		} catch (error) {
			if (retries > 0) {
				logger.warn(`Turnstile validation failed, retrying... (${retries} attempts left)`, { error });
				await new Promise(resolve => setTimeout(resolve, this.retryDelay));
				return this.validateWithRetry(formData, retries - 1);
			}
			throw error;
		}
	}

	async validate(options: EnhancedValidationOptions | string): Promise<TurnstileValidationResult> {
		try {
			// Handle backward compatibility
			const opts: EnhancedValidationOptions = typeof options === 'string' 
				? { token: options } 
				: options;

			const { token, ip, origin, hostname, idempotencyKey } = opts;

			// Build form data
			const formData = new FormData();
			formData.append('secret', this.secretKey);
			formData.append('response', token);
			
			if (ip) {
				formData.append('remoteip', ip);
			}

			// Add idempotency key if enabled
			if (this.enableIdempotency && idempotencyKey) {
				formData.append('idempotency_key', idempotencyKey);
			} else if (this.enableIdempotency) {
				// Generate a default idempotency key
				const key = crypto.randomUUID();
				formData.append('idempotency_key', key);
				logger.debug('Generated idempotency key', { key });
			}

			// Send validation request with retry
			const result = await this.validateWithRetry(formData);

			// Perform additional security checks
			if (result.success) {
				// Check hostname if allowlist is configured
				if (this.allowedHostnames.size > 0 && result.hostname) {
					if (!this.allowedHostnames.has(result.hostname)) {
						logger.warn('Turnstile validation failed: hostname not in allowlist', {
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
				if (this.allowedOrigins.size > 0 && origin) {
					if (!this.allowedOrigins.has(origin)) {
						logger.warn('Turnstile validation failed: origin not in allowlist', {
							origin,
							allowed: Array.from(this.allowedOrigins),
						});
						return {
							...result,
							success: false,
							error_codes: ['origin-not-allowed'],
						};
					}
				}

				// Check if provided hostname matches Turnstile's recorded hostname
				if (hostname && result.hostname && hostname !== result.hostname) {
					logger.warn('Turnstile validation failed: hostname mismatch', {
						provided: hostname,
						recorded: result.hostname,
					});
					return {
						...result,
						success: false,
						error_codes: ['hostname-mismatch'],
					};
				}

				logger.info('Turnstile validation successful', {
					hostname: result.hostname,
					challenge_ts: result.challenge_ts,
					action: result.action,
					cdata: result.cdata,
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

	/**
	 * Add allowed hostnames dynamically
	 */
	addAllowedHostname(hostname: string): void {
		this.allowedHostnames.add(hostname);
	}

	/**
	 * Add allowed origins dynamically
	 */
	addAllowedOrigin(origin: string): void {
		this.allowedOrigins.add(origin);
	}

	/**
	 * Remove allowed hostname
	 */
	removeAllowedHostname(hostname: string): void {
		this.allowedHostnames.delete(hostname);
	}

	/**
	 * Remove allowed origin
	 */
	removeAllowedOrigin(origin: string): void {
		this.allowedOrigins.delete(origin);
	}

	/**
	 * Get current configuration (for debugging)
	 */
	getConfig(): {
		allowedHostnames: string[];
		allowedOrigins: string[];
		enableIdempotency: boolean;
		isTestKey: boolean;
	} {
		return {
			allowedHostnames: Array.from(this.allowedHostnames),
			allowedOrigins: Array.from(this.allowedOrigins),
			enableIdempotency: this.enableIdempotency,
			isTestKey: this.isTestKey(),
		};
	}

	/**
	 * Check if using a test key
	 */
	isTestKey(): boolean {
		// Check if using a test key (1x... or 2x... patterns)
		return this.secretKey.startsWith('1x') || this.secretKey.startsWith('2x');
	}

	/**
	 * Create a service instance from environment configuration
	 */
	static fromEnv(env: any): TurnstileServiceEnhanced {
		const allowedHostnames = env.TURNSTILE_ALLOWED_HOSTNAMES
			? env.TURNSTILE_ALLOWED_HOSTNAMES.split(',').map((h: string) => h.trim())
			: [];
			
		const allowedOrigins = env.TURNSTILE_ALLOWED_ORIGINS
			? env.TURNSTILE_ALLOWED_ORIGINS.split(',').map((o: string) => o.trim())
			: [];

		return new TurnstileServiceEnhanced({
			secretKey: env.TURNSTILE_SECRET_KEY,
			allowedHostnames,
			allowedOrigins,
			enableIdempotency: env.TURNSTILE_ENABLE_IDEMPOTENCY !== 'false',
			maxRetries: parseInt(env.TURNSTILE_MAX_RETRIES || '3', 10),
			retryDelay: parseInt(env.TURNSTILE_RETRY_DELAY || '1000', 10),
		});
	}
}

// Export for backward compatibility
export { TurnstileServiceEnhanced as TurnstileService };