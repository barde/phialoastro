# Performance Optimizations for Phialo Design

## Current Performance Baseline

The site already implements several optimizations through Astro and Cloudflare Pages. This guide documents additional optimizations available with Workers deployment.

## 1. Caching Strategy

### Current Setup (via _headers)
The existing `_headers` file provides good caching rules. Ensure these are maintained:

```
# Immutable assets (with hash in filename)
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

# Images
/images/*
  Cache-Control: public, max-age=31536000

# HTML (always fresh)
/*.html
/
  Cache-Control: public, max-age=0, must-revalidate
```

### Workers Enhancement
Workers automatically respects these headers and adds:
- Tiered caching across Cloudflare's network
- Automatic ETag generation
- Smart cache purging

## 2. Image Optimization

### Current: Manual Optimization
- Images are manually optimized before upload
- Multiple formats not automatically served

### Recommended: Cloudflare Images
For a luxury jewelry site, image quality is crucial. Consider:

```bash
# Upload images to Cloudflare Images
curl -X POST \
  -H "Authorization: Bearer <API_TOKEN>" \
  -F "file=@/path/to/image.jpg" \
  https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/images/v1
```

Benefits:
- Automatic WebP/AVIF conversion
- On-the-fly resizing
- Lazy loading support
- $5/month for 100,000 images

### Implementation in Astro:
```astro
---
// In your Astro component
const imageUrl = `https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/public`
---
<img 
  src={imageUrl} 
  srcset={`
    ${imageUrl}?w=400 400w,
    ${imageUrl}?w=800 800w,
    ${imageUrl}?w=1200 1200w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  loading="lazy"
  alt="Luxury jewelry piece"
/>
```

## 3. Compression

### Enable in Cloudflare Dashboard:
1. **Brotli**: Speed → Optimization → Brotli
2. **Auto Minify**: Speed → Optimization → Auto Minify
   - JavaScript: ✓
   - CSS: ✓
   - HTML: ✗ (can break Astro hydration)

## 4. HTTP/3 and Early Hints

### Enable HTTP/3:
- Dashboard → Network → HTTP/3 (with QUIC)

### Enable Early Hints:
- Dashboard → Speed → Optimization → Early Hints

This preloads critical resources while the server prepares the HTML.

## 5. Font Optimization

### Current Setup:
Fonts loaded from Google Fonts. Consider self-hosting for better performance:

1. Download fonts locally
2. Generate WOFF2 versions
3. Preload critical fonts:

```html
<link rel="preload" href="/fonts/playfair-display-v30-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
```

## 6. Bundle Optimization

### Analyze Current Bundle:
```bash
# Add bundle analyzer
npm install -D rollup-plugin-visualizer

# Update astro.config.mjs
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  vite: {
    plugins: [
      visualizer({
        emitFile: true,
        filename: 'stats.html',
      })
    ]
  }
});
```

### Optimize React Components:
- Use dynamic imports for heavy components
- Implement code splitting for routes
- Tree-shake unused Lucide icons

## 7. Monitoring and Analytics

### Cloudflare Web Analytics (Free):
```html
<!-- Add to your layout -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
        data-cf-beacon='{"token": "YOUR_TOKEN"}'></script>
```

### Real User Monitoring:
Monitor Core Web Vitals:
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

## 8. Workers-Specific Optimizations

### Smart Routing:
```json
{
  "assets": {
    "browser_TTL": 31536000,
    "edge_TTL": 2592000,
    "bypass_cache": false
  }
}
```

### Geolocation-Based Optimizations:
Workers can detect user location and:
- Serve region-specific content
- Route to nearest assets
- Implement geographic load balancing

## 9. Checklist for Launch

- [ ] Enable Brotli compression
- [ ] Enable HTTP/3
- [ ] Configure Early Hints
- [ ] Set up Cloudflare Web Analytics
- [ ] Test all image formats load correctly
- [ ] Verify font loading performance
- [ ] Check Core Web Vitals scores
- [ ] Monitor bundle size (< 200KB JS)

## 10. Future Optimizations

### Phase 2 (After Migration):
1. Implement Cloudflare Images
2. Add Web Analytics RUM
3. Explore edge-side personalization

### Phase 3 (Long-term):
1. Consider Cloudflare R2 for large assets
2. Implement progressive enhancement
3. Add offline support with Service Workers

## Measuring Success

### Tools:
- PageSpeed Insights
- WebPageTest (with Cloudflare locations)
- Chrome DevTools Lighthouse

### Target Metrics:
- PageSpeed Score: > 95
- Time to Interactive: < 2s
- Total Page Weight: < 1MB
- First Paint: < 1s

## References

- [Cloudflare Speed Recommendations](https://developers.cloudflare.com/fundamentals/get-started/task-guides/optimize-site-speed/)
- [Astro Performance Guide](https://docs.astro.build/en/concepts/why-astro/#performance)
- [Web Vitals Best Practices](https://web.dev/vitals/)