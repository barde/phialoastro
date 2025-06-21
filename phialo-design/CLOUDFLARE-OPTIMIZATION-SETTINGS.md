# Cloudflare Optimization Settings

This document outlines the Cloudflare dashboard settings that need to be enabled for optimal performance of phialo.de.

## Speed → Optimization Settings

### 1. **Brotli Compression**
- Navigate to: Speed → Optimization
- Enable: **Brotli**
- This provides better compression than gzip (20-30% better compression ratios)

### 2. **Early Hints**
- Navigate to: Speed → Optimization
- Enable: **Early Hints**
- This preloads critical resources before the HTML response

### 3. **Auto Minify**
- Navigate to: Speed → Optimization
- Enable:
  - ✅ JavaScript
  - ✅ CSS
  - ❌ HTML (keep disabled to preserve Astro's optimized HTML)

## Network Settings

### 4. **HTTP/3 (QUIC)**
- Navigate to: Network
- Enable: **HTTP/3 (with QUIC)**
- This provides faster connection establishment and better performance

## Analytics Setup

### 5. **Web Analytics**
- Navigate to: Analytics → Web Analytics
- Get your analytics token
- Replace `YOUR_ANALYTICS_TOKEN` in `BaseLayout.astro` with the actual token

## Additional Recommended Settings

### 6. **Caching → Configuration**
- Browser Cache TTL: **1 year** (static assets are versioned)
- Always Online™: **On** (serves cached version if origin is down)

### 7. **Speed → Optimization → Content Optimization**
- Rocket Loader™: **Off** (can interfere with React hydration)
- Mirage: **On** (optimizes image loading)
- Polish: **Lossy** (if available on your plan)

### 8. **Workers Routes** (if using Cloudflare Workers)
Configure the following routes:
- `phialo.de/*` → Your worker
- `www.phialo.de/*` → Your worker

## Verification

After enabling these settings:

1. Use PageSpeed Insights to verify improvements
2. Check Network tab in Chrome DevTools for:
   - Brotli encoding (`br` in response headers)
   - HTTP/3 protocol
   - Early hints (103 status codes)

## Expected Performance Improvements

With these optimizations enabled:
- 20-30% reduction in transfer size (Brotli)
- 15-20% faster page loads (HTTP/3)
- Improved Core Web Vitals scores
- Better mobile performance

## Notes

- Changes may take 5-10 minutes to propagate
- Clear cache after making changes
- Monitor analytics for performance metrics