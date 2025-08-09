# Phialo Design Cloudflare Worker

<!-- Test change to trigger workflow -->

This directory contains the Cloudflare Worker implementation for serving the Phialo Design website, migrating from Cloudflare Pages to Workers for enhanced control and features.

## Architecture

The Worker uses a modular architecture with comprehensive features:
- Static file serving with proper MIME types
- Contact form API with Turnstile CAPTCHA and email integration
- Security headers (CSP with YouTube support, X-Frame-Options, etc.)
- Cache management with edge caching
- URL redirects and trailing slash removal
- 404 page handling
- Structured logging and error handling
- Performance monitoring with timing middleware

## Project Structure

```
workers/
├── src/
│   ├── index.ts          # Main worker entry point (modular architecture)
│   ├── router/           # Routing configuration
│   │   └── index.ts      # itty-router setup with middleware chain
│   ├── handlers/
│   │   ├── api/          # API endpoints
│   │   │   └── contact.ts # Contact form handler
│   │   ├── assets.ts     # Static file serving
│   │   ├── redirects.ts  # URL redirect logic
│   │   └── security.ts   # Security headers
│   ├── services/
│   │   ├── email/        # Email service providers
│   │   │   ├── EmailService.ts
│   │   │   └── providers/
│   │   │       └── ResendEmailProvider.ts
│   │   └── turnstile.ts  # Turnstile CAPTCHA validation
│   ├── middleware/
│   │   ├── cache.ts      # Caching middleware
│   │   ├── cors.ts       # CORS handling
│   │   ├── timing.ts     # Performance monitoring
│   │   └── validation.ts # Request validation
│   ├── utils/
│   │   ├── errors.ts     # Error handling utilities
│   │   ├── logger.ts     # Structured logging
│   │   └── mime.ts       # MIME type detection
│   ├── config/
│   │   └── index.ts      # Configuration management
│   ├── types/            # TypeScript definitions
│   └── archive/          # Archived implementations (for reference)
├── test/                 # Comprehensive test suite (115 tests)
├── wrangler.toml         # Worker configuration
├── package.json          # Dependencies
└── tsconfig.json         # TypeScript config
```

## Development

### Prerequisites
- Node.js 20+
- pnpm 9.14+
- Cloudflare account with Workers enabled

### Setup

1. Install dependencies:
```bash
cd workers
pnpm install
```

2. Configure Wrangler:
   - Update `zone_id` in `wrangler.toml` with your Cloudflare zone ID
   - Set up your Cloudflare API token: `wrangler login`

### Local Development

Run the worker locally:
```bash
pnpm run dev
```

Run both Astro dev server and Worker together:
```bash
cd ../phialo-design
pnpm run dev:full
```

### Testing

Run tests:
```bash
pnpm test           # Watch mode
pnpm run test:run   # Run once
```

## Deployment

### Preview Deployment
Deploy to preview environment:
```bash
pnpm run deploy:preview
```

### Production Deployment
Deploy to production (requires proper configuration):
```bash
pnpm run deploy:production
```

### PR Preview Deployments
Pull requests automatically deploy preview URLs via GitHub Actions:
- Each PR gets its own isolated environment
- Preview URL format: `https://phialo-design-preview.<branch-name>.workers.dev`
- Automatically updates on each commit
- Comments preview URL on PR with clickable link and deployment info
- Uses Cloudflare's branch deployment feature for proper isolation

#### Preview URL Comment Features
- 🚀 Fancy emoji-enhanced formatting
- 🔗 Direct clickable preview link
- 📊 Deployment metadata (branch, commit, timestamp)
- ℹ️ Helpful preview information in expandable section

## Configuration

### GitHub Secrets Required
For PR preview deployments to work, add these secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Workers deployment permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

To create an API token:
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create a token with "Cloudflare Workers Scripts:Edit" permission
3. Add the token as a GitHub secret

### Environment Variables
- `ENVIRONMENT`: Set to `development`, `preview`, or `production`
- `BRANCH_NAME`: Automatically set for PR deployments

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

## Implementation Consolidation (Issue #313)

As of January 2025, the Workers implementation has been consolidated to use a single, production-ready modular architecture (`src/index.ts`). Previous implementations have been archived in `src/archive/` for reference. The modular architecture provides:

- **Better Maintainability**: Clear separation of concerns with dedicated modules
- **Enhanced Reliability**: Comprehensive error handling and structured logging
- **Production Debugging**: Environment-aware logging and performance monitoring
- **Security**: Centralized security headers with CSP support for YouTube embeds
- **Scalability**: Easy to extend with new features via the middleware system

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
pnpm run tail
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

## Documentation

- [📚 Deployment Guide](../phialo-design/docs/how-to/DEPLOY.md) - Complete setup and deployment instructions

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Sites Guide](https://developers.cloudflare.com/workers/platform/sites/)
- [Issue #32: Migration Details](https://github.com/barde/phialoastro/issues/32)