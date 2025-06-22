# Workers Sites Architecture

This document explains why Workers Sites requires KV storage permissions and how it works.

## Overview

Workers Sites is a Cloudflare feature that serves static files from Workers using KV (Key-Value) storage as the backend.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Build Step    │────▶│  Wrangler Deploy │────▶│ Cloudflare Edge │
│ (Astro → dist/) │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                           │
                               ▼                           ▼
                        ┌──────────────┐            ┌─────────────┐
                        │  KV Storage  │            │   Worker    │
                        │__STATIC_CONTENT│◀─────────│(serves files)│
                        └──────────────┘            └─────────────┘
```

## How It Works

1. **Build Phase**: Astro builds your site into static files in the `dist/` directory

2. **Deploy Phase**: When you run `wrangler deploy` with a `[site]` configuration:
   - Wrangler creates/updates a KV namespace called `__STATIC_CONTENT`
   - All files from the `bucket` directory are uploaded to KV storage
   - Each file becomes a key-value pair (path → file content)
   - An asset manifest is generated mapping URLs to KV keys

3. **Runtime Phase**: When a request comes in:
   - The Worker uses `@cloudflare/kv-asset-handler` 
   - It looks up the requested path in the KV namespace
   - Returns the file with appropriate headers

## Configuration

In `wrangler.toml`:
```toml
[site]
bucket = "../phialo-design/dist"  # Directory containing static files
```

In your Worker code:
```typescript
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

export interface Env {
  __STATIC_CONTENT: any;  // KV namespace automatically injected
}

// Serve files from KV
return await getAssetFromKV({
  request,
  waitUntil: ctx.waitUntil.bind(ctx),
}, {
  ASSET_NAMESPACE: env.__STATIC_CONTENT,
  ASSET_MANIFEST: assetManifest,
});
```

## Required Permissions

Because Workers Sites uses KV storage, your API token needs:

| Permission | Why It's Needed |
|------------|-----------------|
| **Workers Scripts:Edit** | To deploy the Worker code |
| **Workers KV Storage:Edit** | To create/update the KV namespace and upload files |

## Authentication Methods

### OAuth Token (Interactive)
- Created via `wrangler login`
- Automatically includes necessary permissions
- Best for local development
- Cannot be used in CI/CD

### API Token (Non-Interactive)
- Created manually in Cloudflare dashboard
- Must explicitly grant permissions
- Best for CI/CD environments
- Used in GitHub Actions

## Common Issues

### "Authentication error [code: 10000]"
This occurs when the API token lacks KV storage permissions. Even if your account has Super Administrator privileges, API tokens have their own permission scope.

### Solution
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Edit your token or create a new one
3. Enable both:
   - Cloudflare Workers Scripts:Edit
   - Workers KV Storage:Edit

## Alternative Approaches

If you don't want to use KV storage:

1. **Remove Workers Sites**: Delete the `[site]` section from `wrangler.toml`
2. **Bundle assets**: Include static files directly in your Worker bundle
3. **External storage**: Serve static files from a CDN or object storage
4. **Custom implementation**: Write your own file serving logic

However, Workers Sites with KV is the recommended approach for static sites because it handles:
- Automatic file uploads
- Content-type detection
- Cache headers
- Asset versioning
- Global distribution