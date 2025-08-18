# Setting Up Core Web Vitals Monitoring

This guide explains how to configure and view the Core Web Vitals monitoring system that was implemented in PR #376.

## Table of Contents
- [Overview](#overview)
- [Step 1: Create Cloudflare KV Namespace](#step-1-create-cloudflare-kv-namespace)
- [Step 2: Bind KV to Workers](#step-2-bind-kv-to-workers)
- [Step 3: View Metrics](#step-3-view-metrics)
- [Step 4: Create a Dashboard](#step-4-create-a-dashboard)
- [Alternative: Use External Analytics](#alternative-use-external-analytics)

## Overview

The Core Web Vitals monitoring system collects real user metrics (RUM) including:
- **LCP** (Largest Contentful Paint) - Loading performance
- **INP** (Interaction to Next Paint) - Interactivity
- **CLS** (Cumulative Layout Shift) - Visual stability
- **FCP** (First Contentful Paint) - Initial render
- **TTFB** (Time to First Byte) - Server response time

These metrics are sent to a Cloudflare Worker endpoint (`/api/vitals`) which stores them in KV storage for analysis.

## Step 1: Create Cloudflare KV Namespace

### Via Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **Workers & Pages** → **KV**
4. Click **Create namespace**
5. Name it `phialo-vitals-production` (for production) and `phialo-vitals-preview` (for staging)
6. Click **Create**
7. Copy the namespace IDs for the next step

### Via Wrangler CLI

```bash
# Create production namespace
npx wrangler kv:namespace create "VITALS_STORE" --env production
# Output: Created namespace with ID: xxxx-xxxx-xxxx
# Copy this ID!

# Create preview namespace
npx wrangler kv:namespace create "VITALS_STORE" --env preview
# Output: Created namespace with ID: yyyy-yyyy-yyyy
# Copy this ID!
```

## Step 2: Bind KV to Workers

### Update wrangler.toml

Add the KV namespace bindings to your `workers/wrangler.toml`:

```toml
# Production environment
[env.production]
name = "phialo-design"
kv_namespaces = [
  { binding = "VITALS_STORE", id = "YOUR_PRODUCTION_KV_ID_HERE" }
]

# Preview environment
[env.preview]
name = "phialo-design-preview"
kv_namespaces = [
  { binding = "VITALS_STORE", id = "YOUR_PREVIEW_KV_ID_HERE" }
]
```

### Via GitHub Secrets (for CI/CD)

Add these secrets to your GitHub repository:
1. Go to Settings → Secrets and variables → Actions
2. Add:
   - `CLOUDFLARE_KV_VITALS_PRODUCTION`: Your production KV namespace ID
   - `CLOUDFLARE_KV_VITALS_PREVIEW`: Your preview KV namespace ID

## Step 3: View Metrics

### Option A: Cloudflare Dashboard (Basic)

Currently, Cloudflare KV doesn't provide a built-in analytics dashboard. You can:

1. Go to **Workers & Pages** → **KV** → Select your namespace
2. Browse stored metrics manually (not ideal for analysis)

### Option B: Wrangler CLI Query

```bash
# List all metrics
npx wrangler kv:key list --namespace-id=YOUR_KV_ID --prefix="vitals:"

# Get specific metric
npx wrangler kv:get "vitals:session-id:LCP:timestamp" --namespace-id=YOUR_KV_ID

# Get all metrics for a session
npx wrangler kv:key list --namespace-id=YOUR_KV_ID --prefix="vitals:SESSION_ID"
```

### Option C: Create a Worker API Endpoint

Create a new file `functions/api/vitals-dashboard.js`:

```javascript
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '24h';
  const metric = url.searchParams.get('metric') || 'all';
  
  if (!env.VITALS_STORE) {
    return new Response('KV namespace not configured', { status: 500 });
  }
  
  // List all keys with prefix
  const keys = await env.VITALS_STORE.list({ prefix: 'vitals:' });
  
  // Fetch all values
  const metrics = [];
  for (const key of keys.keys) {
    const value = await env.VITALS_STORE.get(key.name);
    if (value) {
      metrics.push(JSON.parse(value));
    }
  }
  
  // Filter by period and metric type
  const now = Date.now();
  const periodMs = period === '24h' ? 86400000 : 
                   period === '7d' ? 604800000 : 
                   2592000000; // 30d
  
  const filtered = metrics.filter(m => {
    const age = now - new Date(m.timestamp).getTime();
    return age <= periodMs && (metric === 'all' || m.name === metric);
  });
  
  // Calculate percentiles
  const summary = calculateSummary(filtered);
  
  return new Response(JSON.stringify(summary, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}

function calculateSummary(metrics) {
  const grouped = {};
  
  metrics.forEach(m => {
    if (!grouped[m.name]) {
      grouped[m.name] = {
        name: m.name,
        count: 0,
        values: [],
        good: 0,
        needsImprovement: 0,
        poor: 0
      };
    }
    
    const group = grouped[m.name];
    group.count++;
    group.values.push(m.value);
    
    if (m.rating === 'good') group.good++;
    else if (m.rating === 'needs-improvement') group.needsImprovement++;
    else group.poor++;
  });
  
  // Calculate percentiles for each metric
  Object.values(grouped).forEach(group => {
    group.values.sort((a, b) => a - b);
    group.p50 = percentile(group.values, 50);
    group.p75 = percentile(group.values, 75);
    group.p90 = percentile(group.values, 90);
    group.p99 = percentile(group.values, 99);
    delete group.values; // Remove raw values from response
  });
  
  return {
    period: `Last ${metrics.length} metrics`,
    metrics: grouped,
    summary: {
      totalSessions: new Set(metrics.map(m => m.sessionId)).size,
      totalMetrics: metrics.length
    }
  };
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const index = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.max(0, index)];
}
```

Then access your metrics at: `https://phialo.de/api/vitals-dashboard?period=24h&metric=LCP`

## Step 4: Create a Dashboard

### Simple HTML Dashboard

Create `phialo-design/public/vitals-dashboard.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Web Vitals Dashboard</title>
  <style>
    body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
    .metric { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; }
    .good { border-left: 4px solid #0cce6b; }
    .needs-improvement { border-left: 4px solid #ffa400; }
    .poor { border-left: 4px solid #ff4e42; }
    .value { font-size: 2em; font-weight: bold; }
    .percentiles { display: flex; gap: 20px; margin-top: 10px; }
    .percentile { flex: 1; text-align: center; }
  </style>
</head>
<body>
  <h1>Core Web Vitals Dashboard</h1>
  <div id="metrics">Loading...</div>
  
  <script>
    async function loadMetrics() {
      try {
        const response = await fetch('/api/vitals-dashboard?period=24h');
        const data = await response.json();
        
        const container = document.getElementById('metrics');
        container.innerHTML = '';
        
        Object.values(data.metrics).forEach(metric => {
          const goodPercent = (metric.good / metric.count * 100).toFixed(1);
          const rating = goodPercent >= 75 ? 'good' : 
                        goodPercent >= 50 ? 'needs-improvement' : 'poor';
          
          container.innerHTML += `
            <div class="metric ${rating}">
              <h2>${metric.name}</h2>
              <div class="value">${metric.p75.toFixed(2)}</div>
              <div>75th percentile</div>
              <div class="percentiles">
                <div class="percentile">
                  <strong>P50:</strong> ${metric.p50.toFixed(2)}
                </div>
                <div class="percentile">
                  <strong>P75:</strong> ${metric.p75.toFixed(2)}
                </div>
                <div class="percentile">
                  <strong>P90:</strong> ${metric.p90.toFixed(2)}
                </div>
                <div class="percentile">
                  <strong>P99:</strong> ${metric.p99.toFixed(2)}
                </div>
              </div>
              <div style="margin-top: 10px;">
                Good: ${goodPercent}% | 
                Needs Improvement: ${(metric.needsImprovement / metric.count * 100).toFixed(1)}% | 
                Poor: ${(metric.poor / metric.count * 100).toFixed(1)}%
              </div>
            </div>
          `;
        });
        
        container.innerHTML += `
          <div style="margin-top: 20px; color: #666;">
            Total Sessions: ${data.summary.totalSessions} | 
            Total Metrics: ${data.summary.totalMetrics}
          </div>
        `;
      } catch (error) {
        document.getElementById('metrics').innerHTML = 'Error loading metrics: ' + error.message;
      }
    }
    
    loadMetrics();
    setInterval(loadMetrics, 30000); // Refresh every 30 seconds
  </script>
</body>
</html>
```

Access at: `https://phialo.de/vitals-dashboard.html` (protect with authentication in production!)

## Alternative: Use External Analytics

If you prefer not to manage your own analytics infrastructure, you can modify the `WebVitalsMonitor` to send data to:

### Option 1: Google Analytics 4

```javascript
// In WebVitalsMonitor.astro, replace sendMetricsBatch with:
function sendMetricsBatch() {
  if (typeof gtag !== 'undefined') {
    metricsQueue.forEach(metric => {
      gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: metric.delta,
        non_interaction: true
      });
    });
  }
  metricsQueue = [];
}
```

### Option 2: Vercel Analytics

```bash
pnpm add @vercel/analytics
```

```javascript
// In WebVitalsMonitor.astro
import { webVitals } from '@vercel/analytics';
webVitals({
  analyticsId: 'YOUR_ANALYTICS_ID'
});
```

### Option 3: Send to Custom Endpoint

Modify the `METRICS_ENDPOINT` in `WebVitalsMonitor.astro`:

```javascript
const METRICS_ENDPOINT = 'https://your-analytics-api.com/vitals';
```

## Viewing Metrics in Development

During development, metrics are logged to the browser console. Open DevTools and look for colored logs:
- 🟢 Green: Good rating
- 🟠 Orange: Needs improvement
- 🔴 Red: Poor rating

Example:
```
[Web Vitals] LCP: 1204.30 (good)
[Web Vitals] FCP: 523.10 (good)
[Web Vitals] CLS: 0.05 (good)
```

## Monitoring Thresholds

Based on Google's Core Web Vitals thresholds:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | ≤ 4s | > 4s |
| INP | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS | ≤ 0.1 | ≤ 0.25 | > 0.25 |
| FCP | ≤ 1.8s | ≤ 3s | > 3s |
| TTFB | ≤ 800ms | ≤ 1.8s | > 1.8s |

## Troubleshooting

### Metrics not appearing in KV
1. Check KV namespace is bound: `npx wrangler kv:namespace list`
2. Verify Worker has KV binding in `wrangler.toml`
3. Check Worker logs: `npx wrangler tail phialo-design`

### No metrics being sent
1. Check browser console for errors
2. Verify `/api/vitals` endpoint responds: `curl -X POST https://phialo.de/api/vitals -d '{"metrics":[],"context":{}}'`
3. Check Network tab in DevTools for beacon requests

### KV storage limits
- Free tier: 1GB storage, 100,000 reads/day, 1,000 writes/day
- For high traffic, consider:
  - Sampling (only send metrics for X% of users)
  - External analytics service
  - Paid Cloudflare plan

## Next Steps

1. Set up alerting for performance regressions
2. Create automated reports
3. Integrate with your CI/CD pipeline
4. Set up real-time monitoring dashboard
5. Configure data retention policies