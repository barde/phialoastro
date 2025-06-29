# Cloudflare Preview Deployments

This guide explains how preview deployments work with our Cloudflare Workers setup.

## Overview

We use Cloudflare's native Preview URLs feature for deploying preview versions of the site. This provides:

- Automatic preview URLs for every deployment
- Stable URLs for each version
- No manual cleanup required
- Built-in support in wrangler

## How It Works

### Automatic Preview URLs

Every time we deploy a new version (including PR builds), Cloudflare automatically generates a preview URL in the format:

```
<VERSION_PREFIX>-phialo-design.<SUBDOMAIN>.workers.dev
```

For example:
- `abc123-phialo-design.meise.workers.dev`
- `xyz456-phialo-design.meise.workers.dev`

### GitHub Actions Workflow

Our workflow (`cloudflare-deploy.yml`) handles deployments automatically:

1. **Production Deployments** (master branch only):
   - Runs `wrangler deploy --env production`
   - Deploys to `phialo.de`
   - Updates the live production site

2. **Preview Deployments** (PRs and other branches):
   - Runs `wrangler versions upload --experimental-versions`
   - Creates a new version without deploying to production
   - Generates a unique preview URL
   - Comments the URL on the PR

### Configuration

The `wrangler.toml` configuration is simplified:

```toml
name = "phialo-design"
main = "src/index.ts"
compatibility_date = "2024-09-25"
workers_dev = true

[assets]
directory = "../phialo-design/dist"
binding = "ASSETS"

# Production environment
[env.production]
name = "phialo-design"
route = "phialo.de/*"
workers_dev = false
```

## Usage

### Creating a Preview

1. Open a PR or push to a non-master branch
2. GitHub Actions will automatically build and create a preview
3. Find the preview URL in:
   - PR comments (for pull requests)
   - GitHub Actions logs (for branch pushes)

### Accessing Previews

Preview URLs are:
- Publicly accessible by default
- Stable (won't change even if you push new commits)
- Available indefinitely (no automatic cleanup needed)

### Manual Deployment

To manually create a preview deployment:

```bash
cd workers
npm run build  # Build the Astro site first
npx wrangler versions upload --experimental-versions
```

This will output a preview URL you can share with others.

## Key Differences from Previous Setup

### Before (Custom Implementation)
- Created separate workers for each PR (`phialo-pr-123`)
- Required manual cleanup workflows
- Complex URL generation logic
- Multiple worker instances to manage

### Now (Native Preview URLs)
- Single worker with multiple versions
- Automatic URL generation by Cloudflare
- No cleanup needed
- Simpler configuration

## Troubleshooting

### Preview URL Not Working?

1. Check the GitHub Actions logs for the deployment URL
2. Ensure the build completed successfully
3. Wait a few seconds for the deployment to propagate

### Need to Find a Preview URL?

Use wrangler to list recent deployments:

```bash
cd workers
npx wrangler deployments list
```

### Authentication Issues?

Preview URLs are public by default. To restrict access:
1. Configure Cloudflare Access
2. Set up authentication rules in the Cloudflare dashboard

## Benefits

1. **Simplicity**: No complex workflow logic needed
2. **Reliability**: Cloudflare handles URL generation and routing
3. **Performance**: Leverages Cloudflare's edge network
4. **Cost**: More efficient use of resources (single worker, multiple versions)
5. **Maintenance**: No cleanup workflows or orphaned workers

## References

- [Cloudflare Preview URLs Documentation](https://developers.cloudflare.com/workers/configuration/previews/)
- [Wrangler Versions Documentation](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)
- [GitHub Actions Integration](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)