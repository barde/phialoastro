# Cloudflare Analytics Engine Setup for Web Vitals

This guide explains how to set up Cloudflare Analytics Engine to collect and analyze Core Web Vitals metrics.

## Prerequisites

- Cloudflare account with Workers enabled
- Access to your Cloudflare account ID
- Wrangler CLI installed (`npm install -g wrangler`)

## Step 1: Enable Analytics Engine

Analytics Engine is automatically available for all Workers. The binding is already configured in `wrangler.toml`:

```toml
[[env.production.analytics_engine_datasets]]
binding = "VITALS_ANALYTICS"

[[env.preview.analytics_engine_datasets]]
binding = "VITALS_ANALYTICS"
```

No additional setup is required - Analytics Engine datasets are created automatically when you first write data.

## Step 2: Deploy the Updated Worker

Deploy the worker with Analytics Engine support:

```bash
# Deploy to preview
cd workers
npx wrangler deploy --env preview

# Deploy to production
npx wrangler deploy --env production
```

## Step 3: Verify Data Collection

After deployment, metrics should start flowing automatically when users visit your site.

### Check via Wrangler CLI

```bash
# Tail the worker logs to see metrics being received
npx wrangler tail phialo-design --env production

# You should see logs like:
# [Analytics] LCP: 1523.40 (good)
# [Analytics] FCP: 423.10 (good)
```

## Step 4: Query Analytics Data

Analytics Engine data can be queried via:
1. GraphQL API
2. SQL API
3. Cloudflare Dashboard (coming soon)

### Using GraphQL API

Create a file `query-vitals.js`:

```javascript
const ACCOUNT_ID = 'YOUR_ACCOUNT_ID';
const API_TOKEN = 'YOUR_API_TOKEN'; // Needs Analytics:Read permission

async function queryVitals() {
  const query = `
    query GetWebVitals($filter: AccountAnalyticsEngineFilter!) {
      viewer {
        accounts(filter: { accountTag: "${ACCOUNT_ID}" }) {
          analyticsEngineQuery(
            filter: $filter
            limit: 10000
          ) {
            sum(column: "double1") # Sum of metric values
            avg(column: "double1") # Average metric value
            quantiles(column: "double1", probs: [0.5, 0.75, 0.9, 0.95, 0.99])
            count
            dimensions {
              index1  # Metric name
              index2  # Rating
              index3  # Page type
              index4  # Language
            }
          }
        }
      }
    }
  `;

  const variables = {
    filter: {
      dataset: "VITALS_ANALYTICS",
      datetimeStart: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      datetimeEnd: new Date().toISOString(),
      index1: "LCP" // Filter for specific metric, or remove for all
    }
  };

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

queryVitals();
```

### Using SQL API

```javascript
async function queryWithSQL() {
  const sql = `
    SELECT 
      index1 as metric_name,
      index2 as rating,
      index3 as page_type,
      COUNT(*) as count,
      AVG(double1) as avg_value,
      APPROX_QUANTILE(double1, 0.5) as p50,
      APPROX_QUANTILE(double1, 0.75) as p75,
      APPROX_QUANTILE(double1, 0.9) as p90,
      APPROX_QUANTILE(double1, 0.99) as p99
    FROM VITALS_ANALYTICS
    WHERE 
      timestamp >= NOW() - INTERVAL '24' HOUR
      AND index1 IN ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')
    GROUP BY index1, index2, index3
    ORDER BY count DESC
  `;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  );

  const data = await response.json();
  return data;
}
```

## Step 5: Create a Dashboard

### Option A: Simple HTML Dashboard

Create `phialo-design/functions/api/vitals-dashboard.js`:

```javascript
export async function onRequestGet({ env }) {
  const ACCOUNT_ID = env.CF_ACCOUNT_ID;
  const API_TOKEN = env.CF_API_TOKEN;
  
  if (!API_TOKEN) {
    return new Response('API token not configured', { status: 500 });
  }

  const query = `
    SELECT 
      index1 as metric,
      index2 as rating,
      COUNT(*) as count,
      AVG(double1) as avg_value,
      APPROX_QUANTILE(double1, 0.75) as p75
    FROM VITALS_ANALYTICS
    WHERE timestamp >= NOW() - INTERVAL '24' HOUR
    GROUP BY index1, index2
  `;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    }
  );

  const result = await response.json();
  
  // Transform data for easier consumption
  const metrics = {};
  result.data.forEach(row => {
    if (!metrics[row.metric]) {
      metrics[row.metric] = {
        name: row.metric,
        p75: 0,
        ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
        total: 0
      };
    }
    
    metrics[row.metric].ratings[row.rating] = row.count;
    metrics[row.metric].total += row.count;
    if (row.rating === 'good' || row.rating === 'needs-improvement') {
      metrics[row.metric].p75 = Math.max(metrics[row.metric].p75, row.p75);
    }
  });

  return new Response(JSON.stringify(metrics, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

Then create a simple viewer at `phialo-design/public/vitals-viewer.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Web Vitals Dashboard</title>
  <style>
    body { font-family: system-ui; padding: 20px; }
    .metric { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .good { background: #d4f4dd; }
    .needs-improvement { background: #fff3cd; }
    .poor { background: #f8d7da; }
    .value { font-size: 2em; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Core Web Vitals - Last 24 Hours</h1>
  <div id="metrics">Loading...</div>
  
  <script>
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    async function loadMetrics() {
      const response = await fetch('/api/vitals-dashboard');
      const metrics = await response.json();
      
      const container = document.getElementById('metrics');
      container.innerHTML = '';
      
      Object.values(metrics).forEach(metric => {
        const goodRate = (metric.ratings.good / metric.total * 100).toFixed(1);
        const threshold = thresholds[metric.name];
        let rating = 'good';
        
        if (metric.p75 > threshold.poor) rating = 'poor';
        else if (metric.p75 > threshold.good) rating = 'needs-improvement';
        
        container.innerHTML += `
          <div class="metric ${rating}">
            <h2>${metric.name}</h2>
            <div class="value">${metric.p75.toFixed(0)}ms</div>
            <div>P75 (${metric.total} samples)</div>
            <div>
              Good: ${goodRate}% | 
              Needs Work: ${(metric.ratings['needs-improvement'] / metric.total * 100).toFixed(1)}% | 
              Poor: ${(metric.ratings.poor / metric.total * 100).toFixed(1)}%
            </div>
          </div>
        `;
      });
    }
    
    loadMetrics();
    setInterval(loadMetrics, 60000); // Refresh every minute
  </script>
</body>
</html>
```

### Option B: Grafana Integration

You can also send Analytics Engine data to Grafana Cloud:

1. Set up a Grafana Cloud account
2. Create a Cloudflare Worker that queries Analytics Engine and forwards to Grafana
3. Use Grafana's powerful visualization tools

## Data Structure Reference

### Indexes (for filtering/grouping)
- `index1`: Metric name (LCP, INP, CLS, FCP, TTFB)
- `index2`: Rating (good, needs-improvement, poor)
- `index3`: Page type (home, portfolio, services, etc.)
- `index4`: Language (de, en)

### Blobs (string data)
- `blob1`: URL path
- `blob2`: Session ID
- `blob3`: Network type
- `blob4`: Browser
- `blob5`: Device type

### Doubles (numeric data)
- `double1`: Metric value
- `double2`: Delta from previous
- `double3`: Viewport width
- `double4`: Viewport height
- `double5`: Unix timestamp

Additional doubles for attribution (varies by metric type).

## Example Queries

### Get P75 for all metrics
```sql
SELECT 
  index1 as metric,
  APPROX_QUANTILE(double1, 0.75) as p75
FROM VITALS_ANALYTICS
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY index1
```

### Find worst performing pages
```sql
SELECT 
  blob1 as path,
  index1 as metric,
  AVG(double1) as avg_value,
  COUNT(*) as samples
FROM VITALS_ANALYTICS
WHERE 
  timestamp >= NOW() - INTERVAL '24' HOUR
  AND index2 = 'poor'
GROUP BY blob1, index1
ORDER BY samples DESC
LIMIT 10
```

### Compare mobile vs desktop
```sql
SELECT 
  blob5 as device_type,
  index1 as metric,
  APPROX_QUANTILE(double1, 0.75) as p75
FROM VITALS_ANALYTICS
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY blob5, index1
```

## Monitoring Costs

Analytics Engine pricing (as of 2024):
- **Write**: $0.25 per million data points
- **Query**: $0.05 per million rows read
- **Storage**: First 10 million data points free, then $0.025 per million

Example monthly costs for a site with 10,000 daily visitors:
- 10,000 visitors × 5 metrics × 30 days = 1.5M data points
- Write cost: $0.38/month
- Query cost: ~$0.10/month (assuming moderate querying)
- **Total: Less than $1/month**

## Troubleshooting

### No data appearing
1. Check worker logs: `npx wrangler tail phialo-design`
2. Verify Analytics Engine binding in wrangler.toml
3. Check browser console for errors
4. Ensure metrics are being sent to `/api/vitals`

### Query errors
1. Verify API token has Analytics:Read permission
2. Check account ID is correct
3. Ensure dataset name matches binding name

### High costs
1. Implement sampling (only track % of users)
2. Reduce data retention period
3. Optimize query frequency

## Next Steps

1. Set up alerts for performance regressions
2. Create weekly performance reports
3. Build custom dashboards for different stakeholders
4. Integrate with CI/CD for performance budgets