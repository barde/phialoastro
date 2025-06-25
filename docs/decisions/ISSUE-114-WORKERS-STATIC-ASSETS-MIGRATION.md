# ISSUE-114: Workers Static Assets Migration

## Summary

This document describes the migration from Cloudflare Workers Sites (KV-based) to the new Workers static assets feature to resolve storage usage warnings and improve performance.

## Problem

The project was using Workers Sites which stores all static assets in Cloudflare KV storage:
- Reaching 50% of free tier limit (500MB of 1GB)
- No automatic cleanup of old deployments
- Each deployment (~27MB) accumulates in KV
- Multiple environments (production, preview, PR previews) multiply storage usage
- Eventual consistency issues can cause 404s during deployment

## Solution

Migrated to Cloudflare's new Workers static assets feature (launched Sept 2024) which:
- **Eliminates KV storage usage entirely** - static assets are served natively
- Provides better performance with automatic tiered caching
- Simplifies configuration and deployment
- Is the recommended approach (Workers Sites is deprecated)

## Changes Made

### 1. Updated `wrangler.toml` Configuration

**Before:**
```toml
[site]
bucket = "../phialo-design/dist"
```

**After:**
```toml
[assets]
directory = "../phialo-design/dist"
binding = "ASSETS"
not_found_handling = "single-page-application"
```

### 2. Simplified Worker Script

**Before:** Complex KV asset handling with `@cloudflare/kv-asset-handler`
**After:** Simple pass-through to native assets:
```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
```

### 3. Removed Dependencies

- Removed `@cloudflare/kv-asset-handler` from package.json
- No longer need complex asset handling code

### 4. Updated GitHub Workflows

- Updated `ephemeral-preview.yml` to use `[assets]` configuration
- Maintained compatibility with all deployment environments

### 5. Leveraged Native Features

- `_headers` file in public directory handles security and cache headers
- `not_found_handling = "single-page-application"` handles SPA routing
- No custom code needed for common patterns

## Benefits Achieved

1. **Cost Savings**: No more KV storage usage - stay on free tier indefinitely
2. **Better Performance**: Direct asset serving without KV lookup overhead
3. **Simpler Code**: Removed ~100 lines of asset handling logic
4. **Improved Reliability**: No more 404s from eventual consistency
5. **Future-Proof**: Using the modern, supported approach

## Verification Steps

1. ✅ Tested local development with `npm run dev`
2. ✅ Verified build process completes successfully
3. ✅ Confirmed dry-run deployment works
4. ✅ Checked that all existing features are preserved:
   - SPA routing works
   - Security headers are applied
   - Cache headers are correct
   - 404 handling works

## Rollback Plan

If issues arise, rollback is straightforward:
1. Revert the wrangler.toml changes
2. Restore the old worker script
3. Re-add `@cloudflare/kv-asset-handler` dependency

## Next Steps

After confirming the migration works in production:
1. Monitor for any issues
2. Clean up old KV namespaces to free storage
3. Update any remaining documentation references

## References

- [GitHub Issue #114](https://github.com/phialo/phialoastro/issues/114)
- [Workers Static Assets Documentation](https://developers.cloudflare.com/workers/static-assets/)
- [Architecture Documentation](../general/architecture/WORKERS_STATIC_ASSETS_ARCHITECTURE.md)