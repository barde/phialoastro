import { MIME_TYPES } from '../config/index';

/**
 * Get MIME type for a file path
 */
export function getMimeType(pathname: string): string | undefined {
  // Remove query string and hash
  const cleanPath = pathname.split('?')[0].split('#')[0];
  const ext = cleanPath.match(/\.[^.]*$/)?.[0];
  return ext ? MIME_TYPES[ext.toLowerCase()] : undefined;
}

/**
 * Check if MIME type is compressible
 */
export function isCompressible(mimeType: string): boolean {
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'image/svg+xml',
  ];
  
  return compressibleTypes.some(type => mimeType.startsWith(type));
}

/**
 * Check if MIME type is binary
 */
export function isBinary(mimeType: string): boolean {
  const textTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'image/svg+xml',
  ];
  
  return !textTypes.some(type => mimeType.startsWith(type));
}