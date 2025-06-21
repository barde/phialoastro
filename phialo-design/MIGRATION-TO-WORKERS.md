# Migration Guide: Cloudflare Pages to Workers with Static Assets

## Overview

This guide documents the migration from Cloudflare Pages to Workers with Static Assets for the Phialo Design website. The new approach provides the same static hosting capabilities with better long-term support.

## Why Migrate?

1. **Future-proof**: Cloudflare is focusing development on Workers
2. **Same cost**: Free static asset hosting, just like Pages
3. **Better tooling**: Enhanced debugging with `wrangler tail`
4. **Unified platform**: All Cloudflare features in one place

## Migration Steps

### 1. Test Locally

```bash
# Install wrangler globally if not already installed
npm install -g wrangler

# Build the site
npm run build

# Test with Workers locally
npm run dev:worker
```

Visit http://localhost:8787 to verify the site works correctly.

### 2. Deploy to Preview

```bash
# Deploy to preview environment
npm run deploy:worker:preview
```

This creates a preview URL like: `https://phialo-design-preview.{your-subdomain}.workers.dev`

### 3. Test Preview Deployment

- [ ] Verify all pages load correctly
- [ ] Check that Weglot integration works
- [ ] Test language switching
- [ ] Verify images and assets load
- [ ] Check security headers in browser DevTools
- [ ] Test 404 page handling

### 4. Deploy to Production

```bash
# Deploy to production
npm run deploy:worker
```

### 5. Update DNS (if needed)

If using a custom domain, update DNS records:
- Remove CNAME pointing to Pages
- Add CNAME pointing to Workers domain

### 6. Monitor Deployment

```bash
# View real-time logs
cd workers && wrangler tail
```

## Rollback Plan

If issues arise:

1. **Immediate rollback**: Continue using existing Pages deployment
2. **DNS rollback**: Revert DNS changes if made
3. **Debug issues**: Use `wrangler tail` to identify problems

## Key Differences

| Feature | Pages | Workers with Assets |
|---------|-------|-------------------|
| Deployment | `wrangler pages deploy` | `wrangler deploy` |
| Configuration | None needed | `wrangler.json` |
| Preview URLs | Automatic | Automatic |
| Headers | `_headers` file | `_headers` file |
| Redirects | `_redirects` file | `_redirects` file |
| Debugging | Limited | Full `wrangler tail` |

## Configuration Explained

The `workers/wrangler.json` configuration:

```json
{
  "name": "phialo-design",
  "compatibility_date": "2024-01-01",
  "assets": {
    "directory": "../dist",           // Astro build output
    "serve_directly": true,           // No Worker code execution
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "single-page-application"
  }
}
```

## Performance Optimizations

The Workers deployment maintains all existing optimizations:

1. **Automatic compression**: Brotli/gzip
2. **Global CDN**: Same 300+ locations
3. **Smart caching**: Based on file types
4. **HTTP/3 support**: Automatic

## Troubleshooting

### Assets not loading
- Check `wrangler.json` points to correct build directory
- Verify `npm run build` completes successfully

### 404 errors
- Ensure `404.html` exists in build output
- Check `not_found_handling` configuration

### Headers not applied
- Verify `_headers` file is in `dist` directory
- Check syntax of headers file

## Future Enhancements

Once migrated, you can explore:

1. **Cloudflare Images**: For automatic image optimization
2. **Web Analytics**: Free, privacy-focused analytics
3. **D1 Database**: If you need data storage later
4. **Email routing**: For contact forms

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Discord](https://discord.cloudflare.com)