import { describe, it, expect } from 'vitest';
import { getMimeType } from '../src/utils/mime';

describe('Static Handler Utils', () => {
  describe('getMimeType', () => {
    it('should return correct MIME type for HTML files', () => {
      expect(getMimeType('/index.html')).toBe('text/html; charset=utf-8');
      expect(getMimeType('/about.html')).toBe('text/html; charset=utf-8');
    });

    it('should return correct MIME type for JavaScript files', () => {
      expect(getMimeType('/script.js')).toBe('application/javascript; charset=utf-8');
      expect(getMimeType('/module.mjs')).toBe('application/javascript; charset=utf-8');
    });

    it('should return correct MIME type for CSS files', () => {
      expect(getMimeType('/styles.css')).toBe('text/css; charset=utf-8');
    });

    it('should return correct MIME type for image files', () => {
      expect(getMimeType('/image.png')).toBe('image/png');
      expect(getMimeType('/photo.jpg')).toBe('image/jpeg');
      expect(getMimeType('/photo.jpeg')).toBe('image/jpeg');
      expect(getMimeType('/icon.svg')).toBe('image/svg+xml');
      expect(getMimeType('/modern.webp')).toBe('image/webp');
    });

    it('should return correct MIME type for font files', () => {
      expect(getMimeType('/font.woff')).toBe('font/woff');
      expect(getMimeType('/font.woff2')).toBe('font/woff2');
      expect(getMimeType('/font.ttf')).toBe('font/ttf');
    });

    it('should return undefined for unknown file types', () => {
      expect(getMimeType('/unknown.xyz')).toBeUndefined();
      expect(getMimeType('/no-extension')).toBeUndefined();
    });

    it('should handle case-insensitive file extensions', () => {
      expect(getMimeType('/IMAGE.PNG')).toBe('image/png');
      expect(getMimeType('/SCRIPT.JS')).toBe('application/javascript; charset=utf-8');
    });
  });
});