# Core Web Vitals Implementation Guide

## 📊 Overview

This document describes the Core Web Vitals tracking implementation for Phialo Design, using Cloudflare Analytics Engine for Real User Monitoring (RUM). The implementation provides comprehensive performance metrics that directly impact SEO rankings and user experience.

## 🎯 Implementation Status

### ✅ Completed Components

- [x] TypeScript type definitions for Web Vitals
- [x] Client-side Web Vitals collection utility
- [x] Worker API endpoint for metrics ingestion
- [x] Analytics Engine integration
- [x] BaseLayout integration with automatic tracking
- [x] SQL queries for dashboard creation
- [x] Privacy-compliant implementation (no PII collected)
- [x] Cost-optimized with 10% sampling rate

### 📦 Files Created/Modified

```
phialo-design/
├── src/
│   ├── shared/
│   │   ├── types/
│   │   │   └── vitals.ts              # Type definitions
│   │   └── layouts/
│   │       └── BaseLayout.astro       # Modified: Added Web Vitals tracking
│   └── utils/
│       └── web-vitals.ts               # Client-side collection utility
├── docs/
│   └── analytics/
│       ├── web-vitals-queries.sql      # Dashboard SQL queries
│       └── WEB-VITALS-IMPLEMENTATION.md # This documentation

workers/
├── src/
│   ├── types/
│   │   └── worker.ts                  # Modified: Added Analytics Engine binding
│   ├── handlers/
│   │   └── api/
│   │       └── vitals.ts               # Worker API endpoint
│   └── router/
│       └── index.ts                    # Modified: Added /api/vitals route
```

## 🚀 How It Works

### 1. Client-Side Collection

The `web-vitals` library (v5.1.0) collects Core Web Vitals metrics:
- **LCP** (Largest Contentful Paint): Loading performance
- **INP** (Interaction to Next Paint): Interactivity (replaced FID in 2024)
- **CLS** (Cumulative Layout Shift): Visual stability
- **FCP** (First Contentful Paint): Initial render
- **TTFB** (Time to First Byte): Server response time

### 2. Batching & Transmission

Metrics are batched for efficiency:
- Batch size: 5 metrics or 5 seconds timeout
- Uses `navigator.sendBeacon()` for reliability
- Fallback to `fetch()` with `keepalive` flag
- Automatic flush on page unload

### 3. Worker Processing

The `/api/vitals` endpoint:
- Receives batched metrics
- Enriches with server-side data (country via `request.cf`)
- Writes to Analytics Engine
- Non-blocking for performance

### 4. Analytics Engine Storage

Data structure in Analytics Engine:
```javascript
{
  blobs: [url, metric, rating, device, connection, browser, country, language, referrer],
  doubles: [value, timestamp, viewport_width, viewport_height, delta],
  indexes: [sessionId]
}
```

## 📈 Metrics & Thresholds

### Google's Core Web Vitals Thresholds

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| **INP** | ≤ 200ms | ≤ 500ms | > 500ms |
| **CLS** | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| **FCP** | ≤ 1.8s | ≤ 3.0s | > 3.0s |
| **TTFB** | ≤ 800ms | ≤ 1.8s | > 1.8s |

### Sampling Configuration

- **Current Rate**: 10% (0.1)
- **Estimated Cost**: ~$0.10/month for 1,000 daily visitors
- **Adjustable**: Modify `sampling` parameter in BaseLayout.astro

## 🔧 Configuration

### Environment Variables

No additional environment variables required. The implementation uses:
- Existing `VITALS_ANALYTICS` binding in wrangler.toml
- Automatic environment detection (`import.meta.env.PROD`)

### Customization Options

In `BaseLayout.astro`:
```javascript
initWebVitals({
  endpoint: '/api/vitals',      // API endpoint
  sampling: 0.1,                // 10% sampling rate
  debug: false,                  // Console logging
  enableAttribution: true,       // Detailed attribution data
});
```

## 📊 Dashboard Queries

Use the queries in `docs/analytics/web-vitals-queries.sql` to create dashboards:

1. **Core Web Vitals Summary**: P75 values for all metrics
2. **Performance by Page**: Identify problematic pages
3. **Device Type Analysis**: Mobile vs Desktop performance
4. **Geographic Performance**: Country-specific metrics
5. **Time Series**: Hourly/daily trends
6. **Browser Comparison**: Cross-browser performance
7. **Pass Rate Analysis**: Percentage of "good" scores

### Example Dashboard Query

```sql
SELECT
  blob2 AS metric_name,
  quantileWeighted(0.75, double1, _sample_interval) AS p75_value,
  COUNT(*) * _sample_interval AS total_samples
FROM VITALS_ANALYTICS
WHERE timestamp >= NOW() - INTERVAL '7' DAY
  AND blob2 IN ('LCP', 'INP', 'CLS')
GROUP BY metric_name;
```

## 🔐 Privacy & Compliance

### GDPR Compliance

- ✅ No personally identifiable information (PII) collected
- ✅ No cookies required
- ✅ No user consent needed (privacy-preserving)
- ✅ Respects analytics opt-out (`localStorage.getItem('analytics-opt-out')`)

### Data Collected

- Performance metrics only
- Anonymized session IDs
- General device/browser information
- Country from Cloudflare (no IP storage)

## 💰 Cost Analysis

### Cloudflare Analytics Engine Pricing

- **Rate**: $0.25 per million data points
- **Current Usage** (10% sampling):
  - 1,000 daily visitors: ~$0.10/month
  - 10,000 daily visitors: ~$1/month
  - 100,000 daily visitors: ~$10/month

### Cost Optimization Strategies

1. **Sampling**: Adjust rate in BaseLayout.astro
2. **Metric Selection**: Track only critical metrics
3. **Page Filtering**: Exclude admin/test pages
4. **Batching**: Current implementation minimizes API calls

## 🧪 Testing

### Local Development

Web Vitals tracking is disabled in development by default. To test locally:

1. **Enable in development**:
```astro
<!-- In BaseLayout.astro, change: -->
{import.meta.env.PROD && (
<!-- To: -->
{true && (
```

2. **Enable debug mode**:
```javascript
initWebVitals({
  debug: true,  // Enable console logging
  sampling: 1.0, // Track all sessions
});
```

3. **Monitor console** for Web Vitals logs

### Preview Environment

1. Deploy to preview:
```bash
cd workers
pnpm run deploy:preview
```

2. Check Analytics Engine dashboard in Cloudflare

3. Use Chrome DevTools Lighthouse for validation

## 🚨 Monitoring & Alerts

### Setting Up Alerts

1. **Cloudflare Dashboard**:
   - Navigate to Analytics & Logs → Analytics Engine
   - Create alert rules for P75 thresholds

2. **Alert Thresholds**:
   - LCP > 3000ms (Warning)
   - LCP > 4000ms (Critical)
   - INP > 300ms (Warning)
   - INP > 500ms (Critical)
   - CLS > 0.15 (Warning)
   - CLS > 0.25 (Critical)

### Performance Regression Detection

Monitor week-over-week changes:
```sql
-- Use the "Performance Trend" query from web-vitals-queries.sql
```

## 🐛 Troubleshooting

### Common Issues

1. **No data in Analytics Engine**:
   - Check if in production mode
   - Verify sampling rate (might be too low)
   - Check browser console for errors
   - Ensure VITALS_ANALYTICS binding exists

2. **CORS errors**:
   - Worker endpoint includes CORS headers
   - Check if request is from allowed origin

3. **High metric values**:
   - Check for large images without optimization
   - Review JavaScript bundle sizes
   - Analyze third-party scripts

### Debug Mode

Enable detailed logging:
```javascript
// In web-vitals.ts
const config = {
  debug: true,
  sampling: 1.0,
};
```

## 📚 Resources

### Documentation
- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Cloudflare Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Core Web Vitals Guide](https://web.dev/vitals/)

### Tools
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Chrome DevTools Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Web Vitals Extension](https://chrome.google.com/webstore/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma)

## 🔄 Future Enhancements

### Planned Improvements
- [ ] Custom performance marks for Astro Islands
- [ ] Resource timing metrics
- [ ] Long task tracking
- [ ] Error correlation with performance
- [ ] A/B testing integration
- [ ] Custom dashboard in admin panel

### Optimization Opportunities
- [ ] Implement edge-side analytics aggregation
- [ ] Add real-time alerting via Workers
- [ ] Create performance budget enforcement
- [ ] Implement automated optimization suggestions

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review SQL queries for dashboard creation
3. Enable debug mode for troubleshooting
4. Check Cloudflare Analytics Engine logs

---

**Last Updated**: 2025-09-13
**Implementation Version**: 1.0.0
**Author**: Phialo Design Development Team