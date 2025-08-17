# Compression & Caching Strategy Improvements

## Decision Record

**Date**: 2025-01-17
**Issue**: #358
**Status**: Implemented

## Context

Lighthouse audits identified opportunities to improve performance through better compression and caching strategies. The site was using basic gzip compression only and had generic cache headers without optimization for different asset types.

## Decision

Implement a multi-layer compression and caching strategy:

1. **Build-time Pre-compression**: Generate `.gz` and `.br` files during build
2. **Worker-level Asset Serving**: Serve pre-compressed assets based on Accept-Encoding
3. **Edge-level Compression**: Configure Cloudflare Compression Rules for dynamic content
4. **Advanced Caching**: Implement stale-while-revalidate for optimal performance

## Implementation

### 1. Build-time Compression (Vite Plugin)

Added `vite-plugin-compression` to `astro.config.mjs`:

```javascript
// Generate .gz files
viteCompression({
  algorithm: 'gzip',
  ext: '.gz',
  threshold: 1024, // Only compress files > 1KB
  filter: /\.(js|css|html|svg|json|xml|txt|wasm)$/i,
}),

// Generate .br files (Brotli)
viteCompression({
  algorithm: 'brotliCompress',
  ext: '.br',
  threshold: 1024,
  compressionOptions: {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: 11, // Maximum compression
    },
  },
}),
```

### 2. Worker Asset Handler Updates

Enhanced `assets-modern.ts` to:
- Check Accept-Encoding header
- Try to serve `.br` files for Brotli support
- Fall back to `.gz` for gzip support
- Serve uncompressed as final fallback
- Always add `Vary: Accept-Encoding` header

### 3. Stale-While-Revalidate Cache Middleware

Improved `cache.ts` middleware to:
- Parse Cache-Control headers for max-age and SWR values
- Serve stale content while revalidating in background
- Track cache age and freshness
- Add diagnostic headers (X-Cache-State, X-Cache-Revalidate)

### 4. Optimized Cache Headers

Updated `public/_headers` with:

| Asset Type | Cache Strategy | Reasoning |
|------------|---------------|-----------|
| `/_astro/*` (hashed) | `max-age=31536000, immutable` | Content-addressed, never changes |
| Images | `max-age=2592000, swr=86400` | 30 days + 1 day stale |
| WebP/AVIF | `max-age=31536000, swr=86400` | 1 year (optimized formats) |
| Fonts | `max-age=31536000, immutable` | Never change |
| JS/CSS | `max-age=86400, swr=604800` | 1 day + 7 days stale |
| HTML | `max-age=0, must-revalidate` | Always fresh |

### 5. Cloudflare Configuration

#### Wrangler.toml Updates
Added `brotli_content_encoding` compatibility flag to all environments.

#### Compression Rules Script
Created `scripts/configure-compression.sh` to set up:
- Brotli + Gzip for text content
- Disable compression for pre-compressed formats
- Zstandard for large files (>10KB)

## Performance Impact

### Expected Improvements

1. **Bandwidth Reduction**
   - Brotli: 15-20% better than gzip
   - Pre-compression: Zero CPU overhead at runtime

2. **Cache Performance**
   - Hit ratio: >85% expected
   - SWR: Instant responses for stale content

3. **TTFB Improvements**
   - No compression overhead in Workers
   - Edge caching reduces origin requests

### Compression Ratios

| File Type | Original | Gzip | Brotli | Savings |
|-----------|----------|------|--------|---------|
| HTML | 100KB | 25KB | 20KB | 80% |
| CSS | 150KB | 30KB | 24KB | 84% |
| JS | 500KB | 150KB | 120KB | 76% |

## Migration Notes

### Deployment Steps

1. **Build & Deploy**:
   ```bash
   cd phialo-design
   pnpm run build  # Generates compressed assets
   cd ../workers
   pnpm run deploy:preview
   ```

2. **Configure Compression Rules**:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token"
   export CLOUDFLARE_ZONE_ID="your-zone-id"
   ./scripts/configure-compression.sh
   ```

3. **Verify**:
   - Check response headers for `Content-Encoding: br`
   - Monitor CF-Cache-Status headers
   - Run Lighthouse audit

### Rollback Plan

If issues occur:
1. Remove compression plugins from `astro.config.mjs`
2. Revert `assets-modern.ts` changes
3. Deploy without pre-compressed files

## Monitoring

### Key Metrics to Track

1. **Compression**:
   - Content-Encoding header distribution
   - Compression ratios by content type

2. **Cache Performance**:
   - Cache hit ratio
   - SWR revalidation frequency
   - Origin request reduction

3. **User Experience**:
   - TTFB improvements
   - Total page weight reduction
   - Lighthouse performance score

### Debug Headers

The implementation adds several debug headers:
- `CF-Cache-Status`: HIT/MISS/EXPIRED
- `X-Cache-State`: fresh/stale
- `X-Cache-Revalidate`: true when revalidating

## Future Enhancements

1. **Compression Dictionary**: Use shared dictionary compression for further gains
2. **Cache Partitioning**: Implement user-specific cache keys where needed
3. **Push/Preload**: Add resource hints for critical assets
4. **Service Worker**: Client-side caching layer

## References

- [Cloudflare Brotli Documentation](https://developers.cloudflare.com/speed/optimization/content/compression/)
- [Stale-While-Revalidate RFC](https://datatracker.ietf.org/doc/html/rfc5861)
- [Web.dev Compression Guide](https://web.dev/uses-text-compression/)
- [Vite Compression Plugin](https://github.com/vbenjs/vite-plugin-compression)