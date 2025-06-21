# Cloudflare Workers Static Assets Deployment

This directory contains the configuration for deploying the Phialo Design static site using Cloudflare Workers with Static Assets.

## Overview

Cloudflare Workers with Static Assets is the modern way to deploy static sites on Cloudflare, replacing the legacy Cloudflare Pages platform. It provides:

- Same free static asset hosting as Pages
- Better debugging and monitoring tools
- Access to new features as they're released
- Automatic preview URLs for branches

## Configuration

The deployment is configured in `wrangler.json`:

- `assets.directory`: Points to the Astro build output (`../dist`)
- `assets.serve_directly`: Enables direct static serving without Worker code
- `assets.html_handling`: Adds trailing slashes automatically
- `assets.not_found_handling`: Serves 404.html for missing pages

## Deployment

### Prerequisites

```bash
npm install -g wrangler
wrangler login
```

### Production Deployment

```bash
# Build the Astro site first
npm run build

# Deploy to production
cd workers
wrangler deploy
```

### Preview Deployment

```bash
# Deploy to preview environment
cd workers
wrangler deploy --env preview
```

### Local Development

```bash
# Serve the built site locally
cd workers
wrangler dev
```

## Headers and Redirects

Headers and redirects are handled by files in the `dist` directory:

- `dist/_headers`: Security headers and caching rules
- `dist/_redirects`: URL redirects

These files are automatically processed by Workers during deployment.

## Migration from Cloudflare Pages

1. Build your site as usual: `npm run build`
2. Deploy using wrangler: `cd workers && wrangler deploy`
3. Update DNS to point to the Worker (if needed)
4. Delete the Pages project once migration is verified

## Monitoring

View logs and analytics:

```bash
wrangler tail
```

## Benefits over Pages

- Future-proof (Pages is being deprecated)
- Better debugging with `wrangler tail`
- Consistent deployment experience
- Access to Workers ecosystem if needed later