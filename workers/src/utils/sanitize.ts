/**
 * Utility functions for sanitizing sensitive data
 */

/**
 * List of sensitive field names that should be redacted
 */
const SENSITIVE_FIELDS = [
  'apikey',
  'api_key',
  'api-key',
  'authorization',
  'password',
  'secret',
  'token',
  'key',
  'credential',
  'auth',
];

/**
 * Check if a field name contains sensitive keywords
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(sensitive => lowerField.includes(sensitive));
}

/**
 * Sanitize an object by redacting sensitive fields
 */
export function sanitizeObject(obj: any, depth = 0): any {
  if (depth > 10) return '[Max depth reached]'; // Prevent infinite recursion
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      // Redact sensitive fields but show they exist
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize a string that might contain sensitive data
 */
export function sanitizeString(str: string): string {
  // Redact potential API keys or tokens in strings
  return str
    .replace(/Bearer\s+[\w-]+/gi, 'Bearer [REDACTED]')
    .replace(/apikey[=:]\s*[\w-]+/gi, 'apikey=[REDACTED]')
    .replace(/api_key[=:]\s*[\w-]+/gi, 'api_key=[REDACTED]')
    .replace(/token[=:]\s*[\w-]+/gi, 'token=[REDACTED]');
}