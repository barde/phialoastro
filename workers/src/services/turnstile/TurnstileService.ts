import type { TurnstileValidationResult } from '../email/types';
import { logger } from '../../utils/logger';

export class TurnstileService {
	private secretKey: string;
	private siteVerifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

	constructor(secretKey: string) {
		if (!secretKey) {
			throw new Error('Turnstile secret key is required');
		}
		this.secretKey = secretKey;
	}

	async validate(token: string, ip?: string): Promise<TurnstileValidationResult> {
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
}