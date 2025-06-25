# Workers Static Assets Architecture

This document explains the new Cloudflare Workers static assets feature and how it replaces Workers Sites.

## Overview

Workers static assets is Cloudflare's modern approach to serving static files, replacing the legacy Workers Sites (KV-based) approach. It provides better performance, simpler configuration, and eliminates KV storage costs.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Build Step    │────▶│  Wrangler Deploy │────▶│ Cloudflare Edge │
│ (Astro → dist/) │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                           │
                               ▼                           ▼
                        ┌──────────────┐            ┌─────────────┐
                        │ Static Assets│            │   Worker    │
                        │   (Native)   │◀───────────│ env.ASSETS  │
                        └──────────────┘            └─────────────┘
```

## Key Differences from Workers Sites

| Feature | Workers Sites (Old) | Static Assets (New) |
|---------|-------------------|-------------------|
| Storage | KV Storage (costs $) | Native (free) |
| Performance | Eventual consistency | Instant updates |
| Configuration | `[site]` block | `[assets]` block |
| Dependencies | `@cloudflare/kv-asset-handler` | None needed |
| Headers | Worker code only | `_headers` file + Worker |
| Redirects | Worker code only | `_redirects` file + Worker |
| Deployment | Uploads to KV | Direct asset handling |

## How It Works

1. **Build Phase**: Astro builds your site into static files in the `dist/` directory

2. **Deploy Phase**: When you run `wrangler deploy` with an `[assets]` configuration:
   - Wrangler uploads files directly as static assets
   - No KV namespace creation or management
   - Automatic handling of `_headers` and `_redirects` files
   - Instant global distribution

3. **Runtime Phase**: When a request comes in:
   - The Worker can access assets via `env.ASSETS.fetch()`
   - Automatic SPA routing with `not_found_handling`
   - Native MIME type detection
   - Built-in caching strategies

## Configuration

In `wrangler.toml`:
```toml
name = "phialo-design"
main = "src/index.ts"
compatibility_date = "2024-09-25"

[assets]
directory = "../phialo-design/dist"  # Directory containing static files
binding = "ASSETS"                   # Binding name for programmatic access
not_found_handling = "single-page-application"  # SPA support
```

In your Worker code (minimal):
```typescript
export interface Env {
  ASSETS: Fetcher;  // Assets binding
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Static assets are served automatically
    return env.ASSETS.fetch(request);
  },
};
```

## Headers Configuration

### Using `_headers` File (Recommended)
Create a `_headers` file in your `public/` directory:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.js
  Cache-Control: public, max-age=31536000, immutable
```

### Using Worker Code (Advanced)
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await env.ASSETS.fetch(request);
    
    // Add custom headers if needed
    const headers = new Headers(response.headers);
    headers.set('X-Custom-Header', 'value');
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  },
};
```

## Required Permissions

Static assets require simpler permissions than Workers Sites:

| Permission | Why It's Needed |
|------------|-----------------|
| **Workers Scripts:Edit** | To deploy the Worker code |
| ~~Workers KV Storage:Edit~~ | Not needed anymore! |

## Migration Benefits

1. **Cost Savings**: No KV storage usage (stay on free tier)
2. **Better Performance**: Direct asset serving without KV lookup
3. **Simpler Code**: Remove complex asset handling logic
4. **Native Features**: Built-in support for SPAs, headers, redirects
5. **Instant Updates**: No eventual consistency delays
6. **Future-Proof**: Workers Sites is deprecated

## Common Patterns

### SPA with Custom 404
```toml
[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

### Worker-First Routing
```toml
[assets]
directory = "./dist"
binding = "ASSETS"
run_worker_first = true  # Worker handles all requests first
```

### Selective Worker Routing
```toml
[assets]
directory = "./dist"
binding = "ASSETS"
run_worker_first = ["/api/*", "/auth/*"]  # Worker handles these routes
```

## Limitations

1. **File Size**: Individual files limited to 25MB
2. **Total Files**: Up to 20,000 files or 100MB total
3. **No Dynamic Generation**: Assets must exist at deploy time
4. **One Collection**: Only one assets directory per Worker

## Cleanup After Migration

After successfully migrating to static assets:

1. **Remove old dependencies**:
   ```bash
   npm uninstall @cloudflare/kv-asset-handler
   ```

2. **Delete KV namespaces** (after confirming everything works):
   - List namespaces: `wrangler kv namespace list`
   - Delete old namespaces: `wrangler kv namespace delete --namespace-id=XXX`

3. **Update documentation**: Replace references to Workers Sites

4. **Clean up old code**: Remove unused handler files

## References

- [Cloudflare Workers Static Assets Documentation](https://developers.cloudflare.com/workers/static-assets/)
- [Migration Guide](https://developers.cloudflare.com/workers/static-assets/migrate-from-sites/)
- [Headers and Redirects](https://developers.cloudflare.com/workers/static-assets/headers-and-redirects/)