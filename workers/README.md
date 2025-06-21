# Phialo Design Cloudflare Worker

This directory contains the Cloudflare Worker implementation for serving the Phialo Design website, migrating from Cloudflare Pages to Workers for enhanced control and features.

## Architecture

The Worker handles:
- Static file serving with proper MIME types
- Security headers (CSP, X-Frame-Options, etc.)
- Cache management with edge caching
- URL redirects and trailing slash removal
- 404 page handling

## Project Structure

```
workers/
├── src/
│   ├── index.ts          # Main worker entry point
│   ├── handlers/
│   │   ├── static.ts     # Static file serving
│   │   ├── headers.ts    # Security and cache headers
│   │   └── redirects.ts  # URL redirect logic
│   ├── utils/
│   │   ├── cache.ts      # Edge caching utilities
│   │   └── mime.ts       # MIME type detection
│   └── types/
│       └── index.d.ts    # TypeScript definitions
├── test/
│   ├── static.test.ts    # Static handler tests
│   ├── headers.test.ts   # Headers handler tests
│   └── redirects.test.ts # Redirect handler tests
├── wrangler.toml         # Worker configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Development

### Prerequisites
- Node.js 20+
- npm
- Cloudflare account with Workers enabled

### Setup

1. Install dependencies:
```bash
cd workers
npm install
```

2. Configure Wrangler:
   - Update `zone_id` in `wrangler.toml` with your Cloudflare zone ID
   - Set up your Cloudflare API token: `wrangler login`

### Local Development

Run the worker locally:
```bash
npm run dev
```

Run both Astro dev server and Worker together:
```bash
cd ../phialo-design
npm run dev:full
```

### Testing

Run tests:
```bash
npm test           # Watch mode
npm run test:run   # Run once
```

## Deployment

### Preview Deployment
Deploy to preview environment:
```bash
npm run deploy:preview
```

### Production Deployment
Deploy to production (requires proper configuration):
```bash
npm run deploy:production
```

### PR Preview Deployments
Pull requests automatically deploy preview URLs via GitHub Actions:
- Preview URL: `https://phialo-design-preview-pr-{number}.workers.dev`
- Automatically updates on each commit
- Comments preview URL on PR

## Configuration

### Environment Variables
- `ENVIRONMENT`: Set to `development`, `preview`, or `production`
- `BRANCH_NAME`: Used for PR preview deployments

### Wrangler Configuration
Edit `wrangler.toml` to configure:
- Worker name
- Routes and zones
- Environment-specific settings
- KV namespaces (if needed)

## Features

### Static File Serving
- Automatic index.html serving for directories
- Clean URLs (no .html extension required)
- Proper MIME type detection
- 404 page handling

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

### Caching Strategy
- Static assets (JS, CSS, fonts): 1 year cache
- Images: 24 hours cache with stale-while-revalidate
- HTML: No cache (must-revalidate)
- Edge caching with CF-Cache-Status headers

### Redirects
- Trailing slash removal (except root)
- Custom redirect rules (currently disabled due to Firefox issue)
- Query parameters and hash fragments preserved

## Migration from Cloudflare Pages

This Worker replaces Cloudflare Pages deployment with benefits:
- Direct control over request/response handling
- Custom caching strategies
- Advanced routing logic
- Edge computing capabilities
- Better debugging and monitoring

## Troubleshooting

### Common Issues

1. **404 errors for all files**
   - Ensure `dist` directory exists after building
   - Check `wrangler.toml` site bucket path
   - Verify ASSETS binding is configured

2. **Cache not working**
   - Check Cache-Control headers in browser DevTools
   - Verify CF-Cache-Status header
   - Clear Cloudflare cache if needed

3. **Preview deployments failing**
   - Ensure CLOUDFLARE_API_TOKEN secret is set in GitHub
   - Check GitHub Actions logs for errors
   - Verify wrangler is installed in CI

### Debug Commands

View live logs:
```bash
npm run tail
```

Check worker status:
```bash
wrangler deployments list
```

## TODO

- [ ] Implement full redirect rules after Firefox issue resolution
- [ ] Add request logging and analytics
- [ ] Implement A/B testing capabilities
- [ ] Add rate limiting for specific endpoints
- [ ] Set up monitoring and alerts
- [ ] Implement edge-side includes for dynamic content

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Sites Guide](https://developers.cloudflare.com/workers/platform/sites/)
- [Issue #32: Migration Details](https://github.com/owner/repo/issues/32)