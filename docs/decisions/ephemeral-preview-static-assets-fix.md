# Ephemeral Preview Static Assets Fix

## Problem

The ephemeral preview deployments for pull requests were failing with the error:
```
ReferenceError: __STATIC_CONTENT_MANIFEST is not defined
```

This occurred because the deployment command in `.github/workflows/ephemeral-preview.yml` was using:
```bash
npx wrangler deploy --name "$WORKER_NAME" ...
```

When using the `--name` flag, wrangler doesn't automatically use the `[site]` configuration from `wrangler.toml`, which means static assets aren't included in the deployment.

## Root Cause

1. The `--name` flag overrides the worker name but doesn't inherit other configurations
2. Without the `[site]` configuration, wrangler doesn't generate the `__STATIC_CONTENT_MANIFEST`
3. The worker code expects this manifest to serve static assets

## Solutions Implemented

### 1. Quick Fix (Applied)

Updated the ephemeral preview workflow to explicitly specify the site configuration:

```bash
npx wrangler deploy src/index.ts \
  --name "$WORKER_NAME" \
  --compatibility-date "2024-01-01" \
  --site ../phialo-design/dist \
  --var ENVIRONMENT:preview \
  --var PR_NUMBER:${{ github.event.pull_request.number }}
```

Key changes:
- Added `src/index.ts` to specify the entry point
- Added `--site ../phialo-design/dist` to include static assets

### 2. Alternative: Dynamic Configuration Script

Created `workers/scripts/deploy-ephemeral.sh` that generates a temporary `wrangler.toml` for each PR deployment. This approach ensures all configurations are properly applied.

### 3. Future Migration Path

Created `wrangler-modern.toml` using the new Workers Assets feature:
- Uses `[assets]` instead of deprecated `[site]`
- More aligned with Cloudflare's future direction
- Better integration with the Workers platform

## Testing the Fix

After applying the fix, test ephemeral previews:

1. Create a new PR that modifies worker or site code
2. Check the GitHub Actions output for the deployment
3. Verify the preview URL serves both static assets and dynamic routes
4. Confirm no `__STATIC_CONTENT_MANIFEST` errors in the console

## Migration Recommendations

1. **Short term**: Use the quick fix applied to the workflow
2. **Medium term**: Consider using the deployment script for better control
3. **Long term**: Migrate to Workers Assets when stable

## References

- [Cloudflare Workers Static Assets Documentation](https://developers.cloudflare.com/workers/static-assets/)
- [Wrangler CLI Commands](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Workers Sites Migration Guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/)