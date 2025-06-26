import { describe, it, expect } from 'vitest';
import { getMimeType } from '../src/utils/mime';

describe('MIME Type Utility', () => {
  describe('Text Files', () => {
    it('should return correct MIME type for HTML files', () => {
      expect(getMimeType('/index.html')).toBe('text/html; charset=utf-8');
      expect(getMimeType('/about.html')).toBe('text/html; charset=utf-8');
      expect(getMimeType('/path/to/page.html')).toBe('text/html; charset=utf-8');
    });

    it('should return correct MIME type for CSS files', () => {
      expect(getMimeType('/styles.css')).toBe('text/css; charset=utf-8');
      expect(getMimeType('/css/main.css')).toBe('text/css; charset=utf-8');
    });

    it('should return correct MIME type for XML files', () => {
      expect(getMimeType('/sitemap.xml')).toBe('application/xml; charset=utf-8');
      expect(getMimeType('/feed.xml')).toBe('application/xml; charset=utf-8');
    });

    it('should return correct MIME type for JSON files', () => {
      expect(getMimeType('/data.json')).toBe('application/json; charset=utf-8');
      expect(getMimeType('/api/config.json')).toBe('application/json; charset=utf-8');
    });

    it('should return correct MIME type for plain text files', () => {
      expect(getMimeType('/readme.txt')).toBe('text/plain; charset=utf-8');
      expect(getMimeType('/LICENSE.txt')).toBe('text/plain; charset=utf-8');
    });
  });

  describe('JavaScript Files', () => {
    it('should return correct MIME type for JS files', () => {
      expect(getMimeType('/script.js')).toBe('application/javascript; charset=utf-8');
      expect(getMimeType('/app.min.js')).toBe('application/javascript; charset=utf-8');
    });

    it('should return correct MIME type for MJS files', () => {
      expect(getMimeType('/module.mjs')).toBe('application/javascript; charset=utf-8');
      expect(getMimeType('/utils.mjs')).toBe('application/javascript; charset=utf-8');
    });
  });

  describe('Image Files', () => {
    it('should return correct MIME type for PNG files', () => {
      expect(getMimeType('/logo.png')).toBe('image/png');
      expect(getMimeType('/icons/favicon.png')).toBe('image/png');
    });

    it('should return correct MIME type for JPEG files', () => {
      expect(getMimeType('/photo.jpg')).toBe('image/jpeg');
      expect(getMimeType('/photo.jpeg')).toBe('image/jpeg');
      expect(getMimeType('/gallery/image.jpg')).toBe('image/jpeg');
    });

    it('should return correct MIME type for SVG files', () => {
      expect(getMimeType('/icon.svg')).toBe('image/svg+xml');
      expect(getMimeType('/graphics/logo.svg')).toBe('image/svg+xml');
    });

    it('should return correct MIME type for WebP files', () => {
      expect(getMimeType('/modern.webp')).toBe('image/webp');
      expect(getMimeType('/optimized/photo.webp')).toBe('image/webp');
    });

    it('should return correct MIME type for AVIF files', () => {
      expect(getMimeType('/next-gen.avif')).toBe('image/avif');
      expect(getMimeType('/images/hero.avif')).toBe('image/avif');
    });

    it('should return correct MIME type for GIF files', () => {
      expect(getMimeType('/animation.gif')).toBe('image/gif');
      expect(getMimeType('/memes/funny.gif')).toBe('image/gif');
    });

    it('should return correct MIME type for ICO files', () => {
      expect(getMimeType('/favicon.ico')).toBe('image/x-icon');
      expect(getMimeType('/icons/app.ico')).toBe('image/x-icon');
    });
  });

  describe('Font Files', () => {
    it('should return correct MIME type for WOFF files', () => {
      expect(getMimeType('/font.woff')).toBe('font/woff');
      expect(getMimeType('/fonts/roboto.woff')).toBe('font/woff');
    });

    it('should return correct MIME type for WOFF2 files', () => {
      expect(getMimeType('/font.woff2')).toBe('font/woff2');
      expect(getMimeType('/fonts/inter.woff2')).toBe('font/woff2');
    });

    it('should return correct MIME type for TTF files', () => {
      expect(getMimeType('/font.ttf')).toBe('font/ttf');
      expect(getMimeType('/fonts/opensans.ttf')).toBe('font/ttf');
    });

    it('should return correct MIME type for OTF files', () => {
      expect(getMimeType('/font.otf')).toBe('font/otf');
      expect(getMimeType('/fonts/custom.otf')).toBe('font/otf');
    });

    it('should return correct MIME type for EOT files', () => {
      expect(getMimeType('/font.eot')).toBe('application/vnd.ms-fontobject');
      expect(getMimeType('/fonts/legacy.eot')).toBe('application/vnd.ms-fontobject');
    });
  });

  describe('Document Files', () => {
    it('should return correct MIME type for PDF files', () => {
      expect(getMimeType('/document.pdf')).toBe('application/pdf');
      expect(getMimeType('/downloads/guide.pdf')).toBe('application/pdf');
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-insensitive file extensions', () => {
      expect(getMimeType('/IMAGE.PNG')).toBe('image/png');
      expect(getMimeType('/SCRIPT.JS')).toBe('application/javascript; charset=utf-8');
      expect(getMimeType('/Style.CSS')).toBe('text/css; charset=utf-8');
      expect(getMimeType('/Document.PDF')).toBe('application/pdf');
    });

    it('should handle mixed case paths', () => {
      expect(getMimeType('/Path/To/File.HTML')).toBe('text/html; charset=utf-8');
      expect(getMimeType('/Assets/Images/Logo.SVG')).toBe('image/svg+xml');
    });

    it('should return undefined for unknown file types', () => {
      expect(getMimeType('/unknown.xyz')).toBeUndefined();
      expect(getMimeType('/file.random')).toBeUndefined();
      expect(getMimeType('/document.doc')).toBeUndefined();
    });

    it('should return undefined for files without extensions', () => {
      expect(getMimeType('/no-extension')).toBeUndefined();
      expect(getMimeType('/README')).toBeUndefined();
      expect(getMimeType('/Makefile')).toBeUndefined();
    });

    it('should handle files with multiple dots', () => {
      expect(getMimeType('/jquery.min.js')).toBe('application/javascript; charset=utf-8');
      expect(getMimeType('/styles.min.css')).toBe('text/css; charset=utf-8');
      expect(getMimeType('/app.bundle.min.js')).toBe('application/javascript; charset=utf-8');
    });

    it('should handle paths with query strings', () => {
      expect(getMimeType('/script.js?v=1.2.3')).toBe('application/javascript; charset=utf-8');
      expect(getMimeType('/style.css?hash=abc123')).toBe('text/css; charset=utf-8');
    });

    it('should handle paths with hash fragments', () => {
      expect(getMimeType('/page.html#section')).toBe('text/html; charset=utf-8');
      expect(getMimeType('/doc.pdf#page=2')).toBe('application/pdf');
    });

    it('should handle empty string', () => {
      expect(getMimeType('')).toBeUndefined();
    });

    it('should handle root path', () => {
      expect(getMimeType('/')).toBeUndefined();
    });
  });
});