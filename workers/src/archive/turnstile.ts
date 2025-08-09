import { TurnstileValidationResult } from '../services/email/types';
import { logger } from './logger';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function validateTurnstileToken(
  token: string,
  secretKey: string,
  remoteIP?: string
): Promise<TurnstileValidationResult> {
  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIP) {
      formData.append('remoteip', remoteIP);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json() as TurnstileValidationResult;

    if (!result.success) {
      logger.warn('Turnstile validation failed', {
        errorCodes: result.error_codes,
      });
    }

    return result;
  } catch (error) {
    logger.error('Turnstile validation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return {
      success: false,
      error_codes: ['internal-error'],
    };
  }
}