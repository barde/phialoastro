# Build/Deploy Image Documentation

This document describes the build and deployment Docker image for the Phialo Design website.

## Overview

The build/deploy image provides a complete environment for:
- Building the Astro static site
- Optimizing images and assets
- Analyzing bundle sizes
- Deploying to Cloudflare Workers
- Supporting both production and preview environments

## Image Features

### Base Image
- **Node.js 22** on Alpine Linux for minimal size
- **pnpm** for faster dependency installation
- **Cloudflare Wrangler** for deployment
- **Image optimization tools** (sharp, imagemin, svgo)
- **Build analysis tools** for bundle size monitoring

### Included Scripts

1. **`/scripts/build.sh`** - Production build with optimizations
2. **`/scripts/build-preview.sh`** - Preview build with source maps
3. **`/scripts/optimize-images.sh`** - Optimize all project images
4. **`/scripts/analyze-bundle.sh`** - Analyze bundle sizes
5. **`/scripts/deploy.sh`** - Deploy to production
6. **`/scripts/deploy-preview.sh`** - Deploy to preview
7. **`/scripts/full-deploy.sh`** - Complete pipeline (build + deploy)
8. **`/scripts/help.sh`** - Show available commands

## Usage

### Building the Image

```bash
cd ci
./scripts/build-deploy.sh
```

### Running Commands

#### Build for Production
```bash
docker run --rm \
  -v $(pwd)/phialo-design/dist:/workspace/phialo-design/dist \
  phialo-design:build \
  /scripts/build.sh
```

#### Build for Preview
```bash
docker run --rm \
  -v $(pwd)/phialo-design/dist:/workspace/phialo-design/dist \
  phialo-design:build \
  /scripts/build-preview.sh
```

#### Optimize Images
```bash
docker run --rm \
  -v $(pwd)/phialo-design:/workspace/phialo-design \
  phialo-design:build \
  /scripts/optimize-images.sh
```

#### Deploy to Production
```bash
docker run --rm \
  -e CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
  -e CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
  -e WEB3FORMS_ACCESS_KEY=$WEB3FORMS_ACCESS_KEY \
  -v $(pwd)/phialo-design/dist:/workspace/phialo-design/dist:ro \
  phialo-design:build \
  /scripts/deploy.sh
```

#### Full Deployment Pipeline
```bash
docker run --rm \
  -e CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
  -e CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
  -e WEB3FORMS_ACCESS_KEY=$WEB3FORMS_ACCESS_KEY \
  -e ENVIRONMENT=production \
  -v $(pwd):/workspace \
  phialo-design:build \
  /scripts/full-deploy.sh
```

### Using Docker Compose

The image includes a docker-compose configuration for easier usage:

```bash
cd ci/build

# Build for production
docker-compose run --rm build

# Build for preview
docker-compose run --rm build-preview

# Optimize images
docker-compose run --rm optimize

# Analyze bundle
docker-compose run --rm analyze

# Deploy to production
docker-compose run --rm deploy

# Deploy to preview
docker-compose run --rm deploy-preview

# Full deployment pipeline
docker-compose run --rm full-deploy

# Interactive shell
docker-compose run --rm shell
```

## Environment Variables

### Required for Deployment
- `CLOUDFLARE_API_TOKEN` - API token with Workers deployment permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `WEB3FORMS_ACCESS_KEY` - API key for contact form (production only)

### Optional
- `ENVIRONMENT` - Set to `production` or `preview` (default: production)
- `NODE_ENV` - Node environment (automatically set by scripts)
- `ANALYZE_BUNDLE` - Set to `true` to generate bundle analysis
- `OPTIMIZE_IMAGES` - Set to `false` to skip image optimization

## Performance Features

### Image Optimization
- Automatic JPEG compression with mozjpeg
- PNG optimization with quality settings
- WebP generation for large images
- SVG optimization with SVGO
- Preserves originals with size comparison

### Bundle Analysis
- JavaScript and CSS bundle size tracking
- Performance budget enforcement (350KB JS, 50KB CSS)
- Visual bundle analysis with rollup-plugin-visualizer
- Detailed file-by-file size reporting

### Build Optimizations
- Production builds with minification
- Tree shaking and dead code elimination
- CSS purging for unused styles
- Asset inlining for small files
- Compression-ready output

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          cd ci
          ./scripts/build-deploy.sh
      
      - name: Deploy to production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          WEB3FORMS_ACCESS_KEY: ${{ secrets.WEB3FORMS_ACCESS_KEY }}
        run: |
          docker run --rm \
            -e CLOUDFLARE_API_TOKEN \
            -e CLOUDFLARE_ACCOUNT_ID \
            -e WEB3FORMS_ACCESS_KEY \
            -v ${{ github.workspace }}:/workspace \
            phialo-design:build \
            /scripts/full-deploy.sh
```

### Local Development

For local development and testing:

```bash
# Start interactive shell
docker-compose -f ci/build/docker-compose.yml run --rm shell

# Inside container:
cd /workspace/phialo-design
npm run dev  # Start dev server
```

## Troubleshooting

### Common Issues

1. **Build fails with "out of memory"**
   - Increase Docker memory allocation
   - Use `NODE_OPTIONS=--max-old-space-size=4096`

2. **Deployment fails with authentication error**
   - Verify CLOUDFLARE_API_TOKEN has correct permissions
   - Check CLOUDFLARE_ACCOUNT_ID is correct

3. **Image optimization takes too long**
   - Skip with `OPTIMIZE_IMAGES=false`
   - Run optimization separately before build

4. **Bundle size exceeds budget**
   - Run bundle analysis to identify large dependencies
   - Consider dynamic imports for heavy components
   - Review and remove unused dependencies

### Debug Mode

For debugging deployment issues:

```bash
# Run with verbose logging
docker run --rm -it \
  -e CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN \
  -e CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
  -v $(pwd):/workspace \
  phialo-design:build \
  bash

# Inside container, run commands manually:
cd /workspace/workers
npx wrangler whoami  # Check authentication
npx wrangler deploy --dry-run  # Test deployment
```

## Security Considerations

- Never commit sensitive environment variables
- Use GitHub Secrets or similar for CI/CD
- The image doesn't store any credentials
- All secrets are passed at runtime
- Preview deployments use separate API tokens

## Maintenance

### Updating Dependencies

To update the image dependencies:

1. Update versions in the Dockerfile
2. Rebuild the image
3. Test all scripts
4. Update documentation if needed

### Adding New Features

To add new deployment features:

1. Create a new script in `/scripts/`
2. Make it executable in the Dockerfile
3. Add to docker-compose.yml if needed
4. Update help.sh with new command
5. Document in this file

## Performance Metrics

Expected performance characteristics:

- **Image size**: ~500MB (includes Node and build tools)
- **Build time**: 1-3 minutes (depends on optimization)
- **Deployment time**: 30-60 seconds
- **Image optimization**: 20-50% size reduction
- **Bundle size targets**: <350KB JS, <50KB CSS