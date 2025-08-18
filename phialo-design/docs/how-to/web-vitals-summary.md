# Core Web Vitals Monitoring - Implementation Summary

## What Was Implemented

### 1. Client-Side Collection (`WebVitalsMonitor.astro`)
- Collects all Core Web Vitals: LCP, INP, CLS, FCP, TTFB
- Includes attribution data for debugging (what caused poor performance)
- Batches metrics (5 metrics or 5 seconds) for efficiency
- Uses `navigator.sendBeacon` for reliable transmission
- Adds contextual data: page type, language, device, network

### 2. Server-Side Processing (`functions/api/vitals.js`)
- Receives metrics via POST to `/api/vitals`
- Sends data to Cloudflare Analytics Engine
- Structures data for efficient querying:
  - Indexes: metric name, rating, page type, language
  - Blobs: URL path, session ID, browser, device type
  - Doubles: metric values, viewport, timestamps, attribution data

### 3. Analytics Engine Configuration (`wrangler.toml`)
```toml
[[env.production.analytics_engine_datasets]]
binding = "VITALS_ANALYTICS"
```

### 4. Query API (`functions/api/vitals-query.js`)
- Endpoint to query Analytics Engine via SQL
- Returns structured metrics with percentiles
- Requires API credentials (set as secrets)

## Quick Setup Steps

### 1. Deploy the Worker
```bash
cd workers
npx wrangler deploy --env production
```

### 2. Set API Credentials (for querying)
```bash
# Get these from Cloudflare Dashboard
npx wrangler secret put CF_API_TOKEN --env production
npx wrangler secret put CF_ACCOUNT_ID --env production
```

### 3. Verify Data Collection
```bash
# Watch worker logs
npx wrangler tail phialo-design --env production

# You should see:
# [Analytics] LCP: 1234.56 (good)
# [Analytics] FCP: 456.78 (good)
```

### 4. Query Your Metrics
```bash
# After a few hours of data collection
curl https://phialo.de/api/vitals-query?hours=24
```

## What You'll See

Analytics Engine automatically stores your metrics. You can:

1. **Query via API**: Use the `/api/vitals-query` endpoint
2. **Use SQL directly**: Query Analytics Engine with SQL
3. **Build dashboards**: Create custom visualizations
4. **Set up alerts**: Monitor for performance regressions

## Example SQL Queries

```sql
-- Get P75 for all metrics (last 24 hours)
SELECT 
  index1 as metric,
  APPROX_QUANTILE(double1, 0.75) as p75,
  COUNT(*) as samples
FROM VITALS_ANALYTICS
WHERE timestamp >= NOW() - INTERVAL '24' HOUR
GROUP BY index1

-- Find worst performing pages
SELECT 
  blob1 as path,
  AVG(double1) as avg_lcp
FROM VITALS_ANALYTICS
WHERE 
  index1 = 'LCP' 
  AND index2 = 'poor'
  AND timestamp >= NOW() - INTERVAL '24' HOUR
GROUP BY blob1
ORDER BY avg_lcp DESC
LIMIT 10
```

## Costs

Analytics Engine pricing is very affordable:
- **Small site** (1,000 daily visitors): ~$0.10/month
- **Medium site** (10,000 daily visitors): ~$1/month
- **Large site** (100,000 daily visitors): ~$10/month

## Next Steps

1. **Monitor for a week**: Let data accumulate
2. **Identify issues**: Look for pages with poor metrics
3. **Fix problems**: Use attribution data to understand causes
4. **Track improvements**: Compare before/after metrics

## Troubleshooting

### No data showing up?
1. Check browser console for errors
2. Verify `/api/vitals` returns 204: `curl -X POST https://phialo.de/api/vitals -d '{"metrics":[],"context":{}}'`
3. Check worker logs: `npx wrangler tail phialo-design`

### Can't query data?
1. Ensure API credentials are set: `npx wrangler secret list`
2. Verify token has Analytics:Read permission
3. Check account ID matches your Cloudflare account

### Too expensive?
1. Implement sampling (only track 10% of users)
2. Reduce data retention
3. Query less frequently

## Resources

- [Full Setup Guide](./setup-analytics-engine.md)
- [Monitoring Options Comparison](./web-vitals-monitoring-options.md)
- [Cloudflare Analytics Engine Docs](https://developers.cloudflare.com/analytics/analytics-engine/)
- [Web Vitals Documentation](https://web.dev/vitals/)